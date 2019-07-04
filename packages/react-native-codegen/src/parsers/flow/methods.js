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

import type {MethodTypeShape} from '../../CodegenSchema.js';

function buildMethodSchema(property) {
  return undefined;
}

// $FlowFixMe there's no flowtype for ASTs
type PropAST = Object;

function getMethods(
  typeDefinition: $ReadOnlyArray<PropAST>,
): $ReadOnlyArray<MethodTypeShape> {
  return typeDefinition
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(buildMethodSchema)
    .filter(Boolean);
}

module.exports = {
  getMethods,
};
