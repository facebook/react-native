/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {TypeResolutionStatus, TypeDeclarationMap} from '../utils';

const {parseTopLevelType} = require('./parseTopLevelType');

// $FlowFixMe[unclear-type] Use flow-types for @babel/parser
export type ASTNode = Object;

const invariant = require('invariant');

function resolveTypeAnnotation(
  // TODO(T108222691): Use flow-types for @babel/parser
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
): {
  nullable: boolean,
  typeAnnotation: $FlowFixMe,
  typeResolutionStatus: TypeResolutionStatus,
} {
  invariant(
    typeAnnotation != null,
    'resolveTypeAnnotation(): typeAnnotation cannot be null',
  );

  let node =
    typeAnnotation.type === 'TSTypeAnnotation'
      ? typeAnnotation.typeAnnotation
      : typeAnnotation;
  let nullable = false;
  let typeResolutionStatus: TypeResolutionStatus = {
    successful: false,
  };

  for (;;) {
    const topLevelType = parseTopLevelType(node);
    nullable = nullable || topLevelType.optional;
    node = topLevelType.type;

    if (node.type !== 'TSTypeReference') {
      break;
    }

    const resolvedTypeAnnotation = types[node.typeName.name];
    if (resolvedTypeAnnotation == null) {
      break;
    }

    switch (resolvedTypeAnnotation.type) {
      case 'TSTypeAliasDeclaration': {
        typeResolutionStatus = {
          successful: true,
          type: 'alias',
          name: node.typeName.name,
        };
        node = resolvedTypeAnnotation.typeAnnotation;
        break;
      }
      case 'TSInterfaceDeclaration': {
        typeResolutionStatus = {
          successful: true,
          type: 'alias',
          name: node.typeName.name,
        };
        node = resolvedTypeAnnotation;
        break;
      }
      case 'TSEnumDeclaration': {
        typeResolutionStatus = {
          successful: true,
          type: 'enum',
          name: node.typeName.name,
        };
        node = resolvedTypeAnnotation;
        break;
      }
      default: {
        throw new TypeError(
          `A non GenericTypeAnnotation must be a type declaration ('TSTypeAliasDeclaration'), an interface ('TSInterfaceDeclaration'), or enum ('TSEnumDeclaration'). Instead, got the unsupported ${resolvedTypeAnnotation.type}.`,
        );
      }
    }
  }

  return {
    nullable: nullable,
    typeAnnotation: node,
    typeResolutionStatus,
  };
}

module.exports = {
  resolveTypeAnnotation,
};
