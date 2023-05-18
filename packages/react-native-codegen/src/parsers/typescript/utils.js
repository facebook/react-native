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

// $FlowFixMe[unclear-type] Use flow-types for @babel/parser
export type ASTNode = Object;
import type {TypeResolutionStatus, TypeDeclarationMap} from '../utils';
import type {Parser} from '../../parsers/parser';

const {parseTopLevelType} = require('./parseTopLevelType');

const invariant = require('invariant');

function resolveTypeAnnotation(
  // TODO(T108222691): Use flow-types for @babel/parser
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  parser: Parser,
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
      case parser.typeAlias: {
        typeResolutionStatus = {
          successful: true,
          type: 'alias',
          name: node.typeName.name,
        };
        node = resolvedTypeAnnotation.typeAnnotation;
        break;
      }
      case parser.interfaceDeclaration: {
        typeResolutionStatus = {
          successful: true,
          type: 'alias',
          name: node.typeName.name,
        };
        node = resolvedTypeAnnotation;
        break;
      }
      case parser.enumDeclaration: {
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
          `A non GenericTypeAnnotation must be a type declaration ('${parser.typeAlias}'), an interface ('${parser.interfaceDeclaration}'), or enum ('${parser.enumDeclaration}'). Instead, got the unsupported ${resolvedTypeAnnotation.type}.`,
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
