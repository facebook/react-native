/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {PluginObj} from '@babel/core';
import type {NodePath, Visitor} from '@babel/traverse';

const t = require('@babel/types');
const debug = require('debug')('build-types:transforms:inlineTypes');

// TODO: Handle more builtin TS types
const builtinTypeResolvers: {
  +[K: string]: (path: NodePath<t.TSTypeReference>) => void,
} = {
  Omit: path => {
    if (
      !path.node.typeParameters ||
      path.node.typeParameters.params.length !== 2
    ) {
      throw new Error(
        `Omit type must have exactly 2 type parameters. Got ${path.node.typeParameters?.params.length ?? 0}`,
      );
    }

    const [objectType, keys] = path.node.typeParameters.params;

    if (
      !t.isTSTypeLiteral(objectType) ||
      // Only performing the resolution on objects with non-computed string keys.
      !objectType.members.every(
        member => t.isTSPropertySignature(member) && t.isIdentifier(member.key),
      )
    ) {
      debug(`Unsupported Omit first parameter: ${objectType.type}`);
      return;
    }

    if (!t.isTSUnionType(keys)) {
      debug(`Unsupported Omit second parameter: ${keys.type}`);
      return;
    }

    const unionElements = keys.types;
    const stringLiteralElements = unionElements
      .map(element =>
        t.isTSLiteralType(element) && t.isStringLiteral(element.literal)
          ? element.literal
          : null,
      )
      .filter(literal => literal !== null)
      .map(literal => literal.value);

    path.replaceWith(
      t.tsTypeLiteral(
        objectType.members.filter(member => {
          const propName = (
            (member as $FlowFixMe as t.TSPropertySignature)
              .key as $FlowFixMe as t.Identifier
          ).name;

          return !stringLiteralElements.includes(propName);
        }),
      ),
    );
  },
  Readonly: path => {
    if (
      !path.node.typeParameters ||
      path.node.typeParameters.params.length !== 1
    ) {
      throw new Error(
        `Readonly type must have exactly 1 type parameters. Got ${path.node.typeParameters?.params.length ?? 0}`,
      );
    }

    const [objectType] = path.node.typeParameters.params;

    if (!t.isTSTypeLiteral(objectType)) {
      // The parameter was not inlined, so we cannot do anything.
      return;
    }

    path.replaceWith(
      t.tsTypeLiteral(
        (t.cloneDeep(objectType).members ?? []).map(member => {
          if (
            t.isTSMethodSignature(member) ||
            t.isTSCallSignatureDeclaration(member) ||
            t.isTSConstructSignatureDeclaration(member)
          ) {
            return member;
          }
          member.readonly = true;
          return member;
        }),
      ),
    );
  },
};

const typeOperatorResolvers: {
  +[K: string]: (path: NodePath<t.TSTypeOperator>) => void,
} = {
  keyof: path => {
    const unionElements: Array<BabelNodeTSType> = [];

    const typeAnnotation = path.node.typeAnnotation;
    if (t.isTSTypeLiteral(typeAnnotation)) {
      for (const member of typeAnnotation.members) {
        if (t.isTSPropertySignature(member)) {
          if (t.isIdentifier(member.key)) {
            unionElements.push(
              t.tsLiteralType(t.stringLiteral(member.key.name)),
            );
          } else if (t.isStringLiteral(member.key)) {
            unionElements.push(
              t.tsLiteralType(t.stringLiteral(member.key.value)),
            );
          } else {
            debug(
              `Unsupported object literal property key: ${member.key.type}`,
            );
            return;
          }
        } else {
          debug(`Unsupported object literal type key: ${member.type}`);
          return;
        }
      }
    } else {
      debug(`Unsupported type operand for keyof: ${typeAnnotation.type}`);
      return;
    }

    if (unionElements.length === 0) {
      path.replaceWith(t.tsNeverKeyword());
    } else {
      path.replaceWith(t.tsUnionType(unionElements));
    }
  },
};

type GatherTypeAliasesVisitorState = {
  +aliasToPathMap: Map<string, NodePath<t.TSTypeAliasDeclaration>>,
  +aliasesToPrune: Set<string>,
};

/**
 * Gather all type aliases in the file into a map, and remove the ones that
 * are not exported.
 */
const gatherTypeAliasesVisitor: Visitor<GatherTypeAliasesVisitorState> = {
  TSTypeAliasDeclaration(path, state) {
    const alias = path.node.id.name;

    if (path.node.typeParameters) {
      // TODO: Handle generic type alias inlining
      return;
    }

    state.aliasToPathMap.set(alias, path);

    const isExported = path.findParent(p => p.isExportDeclaration());
    if (!isExported) {
      // If not exported, we add it to the set of aliases to prune.
      // If this alias is chosen to NOT be inlined at any point, it
      // will be removed from this set.
      state.aliasesToPrune.add(alias);
    }
  },
};

type KeyofLayer = {
  type: 'keyof',
};

type UnionLayer = {
  type: 'union',
};

type ExtendsLayer = {
  type: 'extends',
};

type StackLayer = KeyofLayer | UnionLayer | ExtendsLayer;

type VisitorState = {
  aliasToPathMap: Map<string, NodePath<t.TSTypeAliasDeclaration>>,
  nodeToAliasMap: Map<t.Node, string>,
  parentTypeAliases: Set<string>,
  /**
   * Layers of operators that the current node is inside of.
   * Used to determine if we should inline a type.
   */
  stack: Array<StackLayer>,
  aliasesToPrune: Set<string>,
};

function pushLayer(state: VisitorState, layer: StackLayer) {
  state.stack.push(layer);
}

function popLayer(state: VisitorState, type: StackLayer['type']) {
  const top = state.stack[state.stack.length - 1];
  if (!top || top.type !== type) {
    throw new Error(
      `Unexpected stack state. Expected ${type}, got ${top.type}`,
    );
  }
  state.stack.pop();
}

function isDefiningType(state: VisitorState, alias: string): boolean {
  return state.parentTypeAliases?.has(alias) ?? false;
}

function insideKeyofLayer(state: VisitorState): boolean {
  return state.stack.some(layer => layer.type === 'keyof');
}

function insideUnionLayer(state: VisitorState): boolean {
  return state.stack.some(layer => layer.type === 'union');
}

function inlineType(
  state: VisitorState,
  path: NodePath<t.Node>,
  alias: string,
): void {
  const declarationPath = state.aliasToPathMap?.get(alias);

  if (!declarationPath) {
    debug(`No declaration found for ${alias ?? ''}`);
    return;
  }

  const cloned = t.cloneDeep(declarationPath.node.typeAnnotation);

  state.parentTypeAliases?.add(alias);
  state.nodeToAliasMap?.set(cloned, alias);
  path.replaceWith(cloned);
}

const inlineTypes: PluginObj<VisitorState> = {
  visitor: {
    Program: {
      enter(path, state): void {
        state.aliasToPathMap = new Map<
          string,
          NodePath<t.TSTypeAliasDeclaration>,
        >();
        state.aliasesToPrune = new Set<string>();
        state.parentTypeAliases = new Set<string>();
        state.nodeToAliasMap = new Map<t.Node, string>();
        state.stack = [];

        path.traverse(gatherTypeAliasesVisitor, {
          aliasToPathMap: state.aliasToPathMap,
          aliasesToPrune: state.aliasesToPrune,
        });
      },

      exit(path, state): void {
        // Remove all aliases that were not inlined
        for (const alias of state.aliasesToPrune) {
          const declarationPath = state.aliasToPathMap?.get(alias);
          declarationPath?.remove();
        }
      },
    },
    TSTypeLiteral: {
      enter() {
        // Do nothing
      },
      exit(path, state) {
        const alias = state.nodeToAliasMap?.get(path.node);
        if (alias !== undefined) {
          state.parentTypeAliases?.delete(alias);
        }
      },
    },
    TSTypeOperator: {
      enter(path, state) {
        if (path.node.operator === 'keyof') {
          pushLayer(state, {type: 'keyof'});
        }
      },
      exit(path, state) {
        if (path.node.operator === 'keyof') {
          popLayer(state, 'keyof');
        }
        typeOperatorResolvers[path.node.operator]?.(path);
      },
    },
    TSTypeParameter: {
      enter(path, state) {
        if (path.node.constraint) {
          pushLayer(state, {type: 'extends'});
        }
      },
      exit(path, state) {
        if (path.node.constraint) {
          popLayer(state, 'extends');
        }
      },
    },
    TSTypeAliasDeclaration: {
      enter(path, state): void {
        state.parentTypeAliases?.add(path.node.id.name);
      },
      exit(path, state): void {
        state.parentTypeAliases?.delete(path.node.id.name);
      },
    },
    TSUnionType: {
      enter(path, state): void {
        pushLayer(state, {type: 'union'});
      },
      exit(path, state): void {
        popLayer(state, 'union');
      },
    },
    TSTypeReference: {
      // Reference inlining is done top-down
      enter(path, state): void {
        if (path.node.typeName.type !== 'Identifier') {
          path.skip();
          return;
        }

        const typeName = path.node.typeName.name;
        if (isDefiningType(state, typeName)) {
          // Skipping recursive type
          path.skip();
          // Name used in a public type, so we don't prune it
          state.aliasesToPrune?.delete(typeName);
          return;
        }

        if (builtinTypeResolvers[typeName]) {
          // Builtin type, do nothing. Will be resolved on exit.
          return;
        }

        if (path.node.typeParameters) {
          // Not a builtin, yet is generic. Skipping for now.
          state.aliasesToPrune?.delete(typeName);
          return;
        }

        if (insideUnionLayer(state) && !insideKeyofLayer(state)) {
          // Skipping inline of union types, except when inside keyof
          state.aliasesToPrune?.delete(typeName);
          return;
        }

        inlineType(state, path, typeName);
      },
      // Builtin-type resolution is done bottom-up
      exit(path, state) {
        if (path.node.typeName.type !== 'Identifier') {
          return;
        }

        const typeName = path.node.typeName.name;

        const resolver = builtinTypeResolvers[typeName];
        if (resolver) {
          resolver(path);
        }
      },
    },
  },
};

// Visitor state is only used internally, so we can safely cast to PluginObj<mixed>.
module.exports = inlineTypes as $FlowFixMe as PluginObj<mixed>;
