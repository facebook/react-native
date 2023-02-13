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

/**
 * This FlowFixMe is supposed to refer to an InterfaceDeclaration or TypeAlias
 * declaration type. Unfortunately, we don't have those types, because flow-parser
 * generates them, and flow-parser is not type-safe. In the future, we should find
 * a way to get these types from our flow parser library.
 *
 * TODO(T71778680): Flow type AST Nodes
 */

function getTypes(ast: $FlowFixMe): TypeDeclarationMap {
  return ast.body.reduce((types, node) => {
    if (node.type === 'ExportNamedDeclaration' && node.exportKind === 'type') {
      if (
        node.declaration != null &&
        (node.declaration.type === 'TypeAlias' ||
          node.declaration.type === 'InterfaceDeclaration')
      ) {
        types[node.declaration.id.name] = node.declaration;
      }
    } else if (
      node.type === 'ExportNamedDeclaration' &&
      node.exportKind === 'value' &&
      node.declaration &&
      node.declaration.type === 'EnumDeclaration'
    ) {
      types[node.declaration.id.name] = node.declaration;
    } else if (
      node.type === 'TypeAlias' ||
      node.type === 'InterfaceDeclaration' ||
      node.type === 'EnumDeclaration'
    ) {
      types[node.id.name] = node;
    }
    return types;
  }, {});
}

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
export type ASTNode = Object;

const invariant = require('invariant');

function resolveTypeAnnotation(
  // TODO(T71778680): This is an Flow TypeAnnotation. Flow-type this
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

  let node = typeAnnotation;
  let nullable = false;
  let typeResolutionStatus: TypeResolutionStatus = {
    successful: false,
  };

  for (;;) {
    if (node.type === 'NullableTypeAnnotation') {
      nullable = true;
      node = node.typeAnnotation;
      continue;
    }

    if (node.type !== 'GenericTypeAnnotation') {
      break;
    }

    const resolvedTypeAnnotation = types[node.id.name];
    if (resolvedTypeAnnotation == null) {
      break;
    }

    switch (resolvedTypeAnnotation.type) {
      case 'TypeAlias': {
        typeResolutionStatus = {
          successful: true,
          type: 'alias',
          name: node.id.name,
        };
        node = resolvedTypeAnnotation.right;
        break;
      }
      case 'EnumDeclaration': {
        typeResolutionStatus = {
          successful: true,
          type: 'enum',
          name: node.id.name,
        };
        node = resolvedTypeAnnotation.body;
        break;
      }
      default: {
        throw new TypeError(
          `A non GenericTypeAnnotation must be a type declaration ('TypeAlias') or enum ('EnumDeclaration'). Instead, got the unsupported ${resolvedTypeAnnotation.type}.`,
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

function getValueFromTypes(value: ASTNode, types: TypeDeclarationMap): ASTNode {
  if (value.type === 'GenericTypeAnnotation' && types[value.id.name]) {
    return getValueFromTypes(types[value.id.name].right, types);
  }
  return value;
}

module.exports = {
  getValueFromTypes,
  resolveTypeAnnotation,
  getTypes,
};
