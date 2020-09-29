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

function getValueFromTypes(value: ASTNode, types: TypeDeclarationMap): ASTNode {
  if (value.type === 'GenericTypeAnnotation' && types[value.id.name]) {
    return getValueFromTypes(types[value.id.name].right, types);
  }
  return value;
}

module.exports = {
  getValueFromTypes,
};
