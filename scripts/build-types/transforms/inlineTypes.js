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
import type {NodePath} from '@babel/traverse';

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
      // The parameter is not a type literal, so we cannot do anything.
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

type VisitorState = {};

const inlineTypes: PluginObj<VisitorState> = {
  visitor: {
    TSTypeOperator: {
      enter(path, state) {},
      exit(path, state) {
        typeOperatorResolvers[path.node.operator]?.(path);
      },
    },
    TSTypeReference: {
      // Reference inlining is done top-down
      enter(path, state): void {},
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
