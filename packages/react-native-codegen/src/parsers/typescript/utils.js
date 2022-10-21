/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TypeAliasResolutionStatus, TypeDeclarationMap} from '../utils';

const {parseTopLevelType} = require('./parseTopLevelType');

/**
 * TODO(T108222691): Use flow-types for @babel/parser
 */

function getTypes(ast: $FlowFixMe): TypeDeclarationMap {
  return ast.body.reduce((types, node) => {
    switch (node.type) {
      case 'ExportNamedDeclaration': {
        if (node.declaration) {
          switch (node.declaration.type) {
            case 'TSTypeAliasDeclaration':
            case 'TSInterfaceDeclaration':
            case 'TSEnumDeclaration': {
              types[node.declaration.id.name] = node.declaration;
              break;
            }
          }
        }
        break;
      }
      case 'TSTypeAliasDeclaration':
      case 'TSInterfaceDeclaration':
      case 'TSEnumDeclaration': {
        types[node.id.name] = node;
        break;
      }
    }
    return types;
  }, {});
}

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
  typeAliasResolutionStatus: TypeAliasResolutionStatus,
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
  let typeAliasResolutionStatus: TypeAliasResolutionStatus = {
    successful: false,
  };

  for (;;) {
    const topLevelType = parseTopLevelType(node);
    nullable = nullable || topLevelType.optional;
    node = topLevelType.type;

    if (node.type === 'TSTypeReference') {
      typeAliasResolutionStatus = {
        successful: true,
        aliasName: node.typeName.name,
      };
      const resolvedTypeAnnotation = types[node.typeName.name];
      if (
        resolvedTypeAnnotation == null ||
        resolvedTypeAnnotation.type === 'TSEnumDeclaration'
      ) {
        break;
      }

      invariant(
        resolvedTypeAnnotation.type === 'TSTypeAliasDeclaration',
        `GenericTypeAnnotation '${node.typeName.name}' must resolve to a TSTypeAliasDeclaration. Instead, it resolved to a '${resolvedTypeAnnotation.type}'`,
      );

      node = resolvedTypeAnnotation.typeAnnotation;
    } else {
      break;
    }
  }

  return {
    nullable: nullable,
    typeAnnotation: node,
    typeAliasResolutionStatus,
  };
}

// TODO(T108222691): Use flow-types for @babel/parser
function isModuleRegistryCall(node: $FlowFixMe): boolean {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callExpression = node;

  if (callExpression.callee.type !== 'MemberExpression') {
    return false;
  }

  const memberExpression = callExpression.callee;
  if (
    !(
      memberExpression.object.type === 'Identifier' &&
      memberExpression.object.name === 'TurboModuleRegistry'
    )
  ) {
    return false;
  }

  if (
    !(
      memberExpression.property.type === 'Identifier' &&
      (memberExpression.property.name === 'get' ||
        memberExpression.property.name === 'getEnforcing')
    )
  ) {
    return false;
  }

  if (memberExpression.computed) {
    return false;
  }

  return true;
}

module.exports = {
  resolveTypeAnnotation,
  getTypes,
  isModuleRegistryCall,
};
