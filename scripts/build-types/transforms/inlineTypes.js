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

/**
 * Aliases that can be blocked from inlining for aeshetic and
 * readability reasons.
 */
const aliasInliningBlocklist = new Set([
  'AlertOptions',
  'Runnable',
  'DimensionsPayload',
  'DisplayMetrics',
  'DisplayMetricsAndroid',
  'NativeTouchEvent',
  'State',
]);

// TODO: Handle more builtin TS types
const builtinTypeResolvers: {
  +[K: string]: (
    path: NodePath<t.TSTypeReference>,
    state: VisitorState,
  ) => void,
} = {
  Omit: (path, state) => {
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
        member =>
          t.isTSPropertySignature(member) &&
          (t.isIdentifier(member.key) || t.isLiteral(member.key)),
      )
    ) {
      debug(`Unsupported Omit first parameter: ${objectType.type}`);
      return;
    }

    const stringLiteralElements = (() => {
      if (t.isTSNeverKeyword(keys)) {
        // 'never' is just an empty union
        return [];
      }

      if (t.isTSLiteralType(keys) && t.isStringLiteral(keys.literal)) {
        return [keys.literal.value];
      }

      if (!t.isTSUnionType(keys)) {
        debug(`Unsupported Omit second parameter: ${keys.type}`);
        return 'skip' as const;
      }

      const unionElements = keys.types;
      return unionElements
        .map(element =>
          t.isTSLiteralType(element) && t.isStringLiteral(element.literal)
            ? element.literal
            : null,
        )
        .filter(literal => literal !== null)
        .map(literal => literal.value);
    })();

    if (stringLiteralElements === 'skip') {
      return;
    }

    replaceWithCleanup(
      state,
      path,
      t.tsTypeLiteral(
        objectType.members.filter(member => {
          const propNode = (member as $FlowFixMe as t.TSPropertySignature)
            .key as $FlowFixMe as t.Identifier | t.Literal;
          const propName =
            propNode.type === 'Identifier' ? propNode.name : propNode.value;

          return !stringLiteralElements.includes(propName);
        }),
      ),
    );

    path.skip(); // We don't want to traverse the new node
  },
  Readonly: (path, state) => {
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

    replaceWithCleanup(
      state,
      path,
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

    path.skip(); // We don't want to traverse the new node
  },
};

const typeOperatorResolvers: {
  +[K: string]: (path: NodePath<t.TSTypeOperator>, state: VisitorState) => void,
} = {
  keyof: (path, state) => {
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

    replaceWithCleanup(
      state,
      path,
      unionElements.length === 0
        ? t.tsNeverKeyword()
        : t.tsUnionType(unionElements),
    );

    path.skip(); // We don't want to traverse the new node
  },
};

function resolveIndexAccess(
  path: NodePath<t.TSIndexedAccessType>,
  state: VisitorState,
): void {
  const objectType = path.node.objectType;
  const indexType = path.node.indexType;

  if (!t.isTSTypeLiteral(objectType)) {
    debug(`Unsupported indexed access object type: ${objectType.type}`);
    return;
  }

  if (!t.isTSLiteralType(indexType) || !t.isStringLiteral(indexType.literal)) {
    debug(`Unsupported indexed access index type: ${indexType.type}`);
    return;
  }

  const indexKey = indexType.literal.value;
  const matchingMember = objectType.members.find(member => {
    if (
      t.isTSPropertySignature(member) &&
      t.isIdentifier(member.key) &&
      member.key.name === indexKey
    ) {
      return true;
    }
    if (
      t.isTSPropertySignature(member) &&
      t.isStringLiteral(member.key) &&
      member.key.value === indexKey
    ) {
      return true;
    }
    return false;
  });

  if (!matchingMember) {
    debug(`No member found for index key: ${indexKey}`);
    return;
  }

  const typeAnnotation = matchingMember.typeAnnotation?.typeAnnotation;
  if (!typeAnnotation) {
    debug(`No type annotation found for member: ${indexKey}`);
    return;
  }

  replaceWithCleanup(state, path, t.cloneDeep(typeAnnotation));
  path.skip(); // We don't want to traverse the new node
}

function resolveIntersection(
  path: NodePath<t.TSIntersectionType>,
  state: VisitorState,
): void {
  const newTypes: Array<BabelNodeTSType> = [];
  const requiredKeys = new Set<string>();
  const mutableKeys = new Set<string>();
  const combinedMembers: Record<string, BabelNodeTSTypeAnnotation[]> = {};

  for (const type of path.node.types) {
    if (!t.isTSTypeLiteral(type)) {
      newTypes.push(type); // Leave it as is, nothing to do here
      continue;
    }

    const members = type.members;
    if (members.length === 0) {
      // Empty object, lets omit it
      continue;
    }

    const membersObj = members.reduce(
      (acc, member) => {
        if (t.isTSPropertySignature(member)) {
          const key = member.key;
          if (t.isIdentifier(key) && member.typeAnnotation) {
            acc.map[key.name] = member;
          } else if (t.isStringLiteral(key) && member.typeAnnotation) {
            acc.map[key.value] = member;
          } else {
            acc.unsupported = true;
            debug(`Unsupported object literal property key: ${key.type}`);
          }
        } else {
          acc.unsupported = true;
          debug(`Unsupported object literal type key: ${member.type}`);
        }

        return acc;
      },
      {
        map: {} as Record<string, BabelNodeTSPropertySignature>,
        unsupported: false,
      },
    );

    if (membersObj.unsupported) {
      // We cannot combine this type with the others, so we leave it as is
      newTypes.push(type);
      continue;
    }

    for (const [key, prop] of Object.entries(membersObj.map)) {
      const annotation = prop.typeAnnotation;
      if (!annotation) {
        continue;
      }

      // $FlowExpectedError[sketchy-null-bool] Missing prop is the same as false
      if (!prop.optional) {
        requiredKeys.add(key);
      }

      // $FlowExpectedError[sketchy-null-bool] Missing prop is the same as false
      if (!prop.readonly) {
        mutableKeys.add(key);
      }

      if (!combinedMembers[key]) {
        combinedMembers[key] = [annotation];
      } else {
        combinedMembers[key].push(annotation);
      }
    }
  }

  // Creating a type literal from the combined keys
  const combinedLiteral = t.tsTypeLiteral(
    Object.entries(combinedMembers).map(([key, values]) => {
      const keyNode = t.isValidIdentifier(key)
        ? t.identifier(key)
        : t.stringLiteral(key);

      const prop = t.tsPropertySignature(
        keyNode,
        values.length === 1
          ? values[0]
          : t.tsTypeAnnotation(
              t.tsIntersectionType(values.map(value => value.typeAnnotation)),
            ),
      );

      prop.optional = !requiredKeys.has(key);
      prop.readonly = !mutableKeys.has(key);

      return prop;
    }),
  );

  newTypes.push(combinedLiteral);

  let newNode;

  if (newTypes.length === 0) {
    newNode = t.tsTypeReference(
      t.identifier('Record'),
      t.tsTypeParameterInstantiation([t.tsStringKeyword(), t.tsNeverKeyword()]),
    );
  } else if (newTypes.length === 1) {
    newNode = newTypes[0];
  } else {
    newNode = t.tsIntersectionType(newTypes);
  }

  const alias = state.nodeToAliasMap?.get(path.node);
  if (alias !== undefined) {
    // Inheriting alias from the node we're replacing
    state.nodeToAliasMap.set(newNode, alias);
    state.nodeToAliasMap.delete(path.node);
  }

  replaceWithCleanup(state, path, newNode);
  path.skip(); // We don't want to traverse the new node
}

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

type ArrayLayer = {
  type: 'array',
};

type TypeParameterInstantiationLayer = {
  type: 'typeParameterInstantiation',
};

type UnresolvableTypeLayer = {
  type: 'unresolvableType',
};

type ResolvableTypeLayer = {
  type: 'resolvableType',
};

type StackLayer =
  | KeyofLayer
  | UnionLayer
  | ExtendsLayer
  | ArrayLayer
  | TypeParameterInstantiationLayer
  | UnresolvableTypeLayer
  | ResolvableTypeLayer;

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

function insideExtendsLayer(state: VisitorState): boolean {
  return state.stack.some(layer => layer.type === 'extends');
}

function insideArrayLayer(state: VisitorState): boolean {
  return state.stack.some(layer => layer.type === 'array');
}

function insideUnresolvableTypeInstantiation(state: VisitorState): boolean {
  const lastUnresolvableTypeIdx = state.stack.findLastIndex(
    layer => layer.type === 'unresolvableType',
  );
  const lastResolvableTypeIdx = state.stack.findLastIndex(
    layer => layer.type === 'resolvableType',
  );
  const lastTypeParameterInstantiationIdx = state.stack.findLastIndex(
    layer => layer.type === 'typeParameterInstantiation',
  );

  return (
    lastUnresolvableTypeIdx >= 0 &&
    lastTypeParameterInstantiationIdx >= 0 &&
    lastResolvableTypeIdx < lastUnresolvableTypeIdx
  );
}

function onNodeExit(state: VisitorState, node: t.Node): void {
  // We're no longer inside the node if we remove it
  const alias = state.nodeToAliasMap?.get(node);
  if (alias !== undefined) {
    state.parentTypeAliases?.delete(alias);
  }
}

function replaceWithCleanup(
  state: VisitorState,
  path: NodePath<t.Node>,
  newNode: t.Node,
) {
  if (newNode === path.node) {
    // Nothing to do
    return;
  }

  // Treating `newNode` as a template, and instantiating it
  const clonedNewNode = t.cloneDeep(newNode);

  // We're removing the node, so let's treat it as if we're exiting it
  onNodeExit(state, path.node);

  path.replaceWith(clonedNewNode);
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
        onNodeExit(state, path.node);
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
        typeOperatorResolvers[path.node.operator]?.(path, state);
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
    TSTypeParameterInstantiation: {
      enter(path, state) {
        pushLayer(state, {type: 'typeParameterInstantiation'});
      },
      exit(path, state) {
        popLayer(state, 'typeParameterInstantiation');
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
    TSIntersectionType: {
      enter() {
        // Do nothing
      },
      exit(path, state) {
        resolveIntersection(path, state);
      },
    },
    TSIndexedAccessType: {
      enter() {
        // Do nothing
      },
      exit(path, state) {
        resolveIndexAccess(path, state);
      },
    },
    // Classes are a very special case, because they can extend a super class,
    // and that super class can be generic. We need to track that superclass
    // either as a resolvable or unresolvable type layer.
    ClassDeclaration: {
      enter(path, state): void {
        if (!path.node.superClass || !path.node.superTypeParameters) {
          // No generic superclass, don't care
          return;
        }

        if (
          t.isIdentifier(path.node.superClass) &&
          builtinTypeResolvers[path.node.superClass.name]
        ) {
          pushLayer(state, {type: 'resolvableType'});
        } else {
          pushLayer(state, {type: 'unresolvableType'});
        }
      },
      exit(path, state): void {
        if (!path.node.superClass || !path.node.superTypeParameters) {
          // No generic superclass, don't care
          return;
        }

        if (
          t.isIdentifier(path.node.superClass) &&
          builtinTypeResolvers[path.node.superClass.name]
        ) {
          popLayer(state, 'resolvableType');
        } else {
          popLayer(state, 'unresolvableType');
        }
      },
    },
    TSTypeReference: {
      // Reference inlining is done top-down
      enter(path, state): void {
        if (
          t.isTSQualifiedName(path.node.typeName) &&
          !!path.node.typeParameters
        ) {
          // A generic qualified name, we need to push an unresolvable layer
          pushLayer(state, {type: 'unresolvableType'});
          return;
        }

        if (path.node.typeName.type !== 'Identifier') {
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

        if (typeName === 'Array' || typeName === 'ReadonlyArray') {
          pushLayer(state, {type: 'array'});
          return;
        }

        if (builtinTypeResolvers[typeName]) {
          pushLayer(state, {type: 'resolvableType'});
          // Builtin type, do nothing. Will be resolved on exit.
          return;
        }

        if (path.node.typeParameters) {
          // Not a builtin, yet is generic. Skipping for now.
          state.aliasesToPrune?.delete(typeName);
          pushLayer(state, {type: 'unresolvableType'});
          return;
        }

        if (
          // Explicit blocklist
          aliasInliningBlocklist.has(typeName) ||
          // Type instantiations of types that are not resolvable
          insideUnresolvableTypeInstantiation(state) ||
          // Skipping inline of union/array types, except when inside keyof
          ((insideUnionLayer(state) ||
            insideArrayLayer(state) ||
            insideExtendsLayer(state)) &&
            !insideKeyofLayer(state))
        ) {
          state.aliasesToPrune?.delete(typeName);
          return;
        }

        inlineType(state, path, typeName);
      },
      // Builtin-type resolution is done bottom-up
      exit(path, state) {
        if (
          t.isTSQualifiedName(path.node.typeName) &&
          !!path.node.typeParameters
        ) {
          // A generic qualified name, we need to pop the unresolvable layer
          popLayer(state, 'unresolvableType');
          return;
        }

        if (path.node.typeName.type !== 'Identifier') {
          return;
        }

        const typeName = path.node.typeName.name;

        if (typeName === 'Array' || typeName === 'ReadonlyArray') {
          popLayer(state, 'array');
          return;
        }

        const resolver = builtinTypeResolvers[typeName];
        if (resolver) {
          popLayer(state, 'resolvableType');
          resolver(path, state);
          return;
        }

        if (path.node.typeParameters) {
          // Not a builtin, yet is generic.
          popLayer(state, 'unresolvableType');
          return;
        }
      },
    },
  },
};

// Visitor state is only used internally, so we can safely cast to PluginObj<mixed>.
module.exports = inlineTypes as $FlowFixMe as PluginObj<mixed>;
