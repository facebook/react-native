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

// $FlowFixMe there's no flowtype for ASTs
export type TypeMap = $ReadOnly<{|[name: string]: Object|}>;

// $FlowFixMe there's no flowtype for ASTs
export type ASTNode = Object;

function getValueFromTypes(value: ASTNode, types: TypeMap): ASTNode {
  if (value.type === 'GenericTypeAnnotation' && types[value.id.name]) {
    return getValueFromTypes(types[value.id.name].right, types);
  }
  return value;
}

module.exports = {
  getValueFromTypes,
};
