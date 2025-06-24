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

import type {VisitorState} from './visitorState';
import type {NodePath} from '@babel/traverse';

import {replaceWithCleanup} from './utils';

const t = require('@babel/types');
const debug = require('debug')('build-types:transforms:inlineTypes');

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

    if (t.isTSNeverKeyword(keys)) {
      // never is just an empty union, so we can just replace the Omit with the object type
      replaceWithCleanup(state, path, objectType);
      path.skip(); // We don't want to traverse the new node
      return;
    }

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

export function canResolveBuiltinType(name: string): boolean {
  return builtinTypeResolvers.hasOwnProperty(name);
}

export function resolveBuiltinType(
  path: NodePath<t.TSTypeReference>,
  state: VisitorState,
): void {
  const name = path.node.typeName.name;
  if (name != null && builtinTypeResolvers.hasOwnProperty(name)) {
    builtinTypeResolvers[name](path, state);
  } else {
    debug(`Unsupported builtin type: ${name ?? 'undefined'}`);
  }
}
