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

import type {ExtendsPropsShape} from '../../../CodegenSchema.js';

function extendsForProp(prop) {
  const name = prop.argument.id.name;
  switch (name) {
    case 'ViewProps':
      return {
        type: 'ReactNativeBuiltInType',
        knownTypeName: 'ReactNativeCoreViewProps',
      };
    default: {
      throw new Error(`Unable to handle prop spread: ${name}`);
    }
  }
}

// $FlowFixMe there's no flowtype for ASTs
type PropsAST = Object;

function getExtendsProps(
  typeDefinition: $ReadOnlyArray<PropsAST>,
): $ReadOnlyArray<ExtendsPropsShape> {
  return typeDefinition
    .filter(prop => prop.type === 'ObjectTypeSpreadProperty')
    .map(extendsForProp);
}

module.exports = {
  getExtendsProps,
};
