/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * This FlowFixMe is supposed to refer to an InterfaceDeclaration or TypeAlias
 * declaration type. Unfortunately, we don't have those types, because flow-parser
 * generates them, and flow-parser is not type-safe. In the future, we should find
 * a way to get these types from our flow parser library.
 *
 * TODO(T71778680): Flow type AST Nodes
 */
export type TypeDeclarationMap = {|[declarationName: string]: $FlowFixMe|};

// $FlowFixMe there's no flowtype for ASTs
export type ASTNode = Object;

const invariant = require('invariant');

type TypeAliasResolutionStatus =
  | $ReadOnly<{|
      successful: true,
      aliasName: string,
    |}>
  | $ReadOnly<{|
      successful: false,
    |}>;

function resolveTypeAnnotation(
  // TODO(T71778680): This is an Flow TypeAnnotation. Flow-type this
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

  let node = typeAnnotation;
  let nullable = false;
  let typeAliasResolutionStatus: TypeAliasResolutionStatus = {
    successful: false,
  };

  for (;;) {
    if (node.type === 'NullableTypeAnnotation') {
      nullable = true;
      node = node.typeAnnotation;
    } else if (node.type === 'GenericTypeAnnotation') {
      typeAliasResolutionStatus = {
        successful: true,
        aliasName: node.id.name,
      };
      const resolvedTypeAnnotation = types[node.id.name];
      if (resolvedTypeAnnotation == null) {
        break;
      }

      invariant(
        resolvedTypeAnnotation.type === 'TypeAlias',
        `GenericTypeAnnotation '${node.id.name}' must resolve to a TypeAlias. Instead, it resolved to a '${resolvedTypeAnnotation.type}'`,
      );
      node = resolvedTypeAnnotation.right;
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

function getValueFromTypes(value: ASTNode, types: TypeDeclarationMap): ASTNode {
  if (value.type === 'GenericTypeAnnotation' && types[value.id.name]) {
    return getValueFromTypes(types[value.id.name].right, types);
  }
  return value;
}

module.exports = {
  getValueFromTypes,
  resolveTypeAnnotation,
};
