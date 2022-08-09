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

import type {ExtendsPropsShape} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../utils.js';

function extendsForProp(prop: PropsAST, types: TypeDeclarationMap) {
  if (!prop.expression) {
    console.log('null', prop);
  }
  const name = prop.expression.name;

  if (types[name] != null) {
    // This type is locally defined in the file
    return null;
  }

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

function removeKnownExtends(
  typeDefinition: $ReadOnlyArray<PropsAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<PropsAST> {
  return typeDefinition.filter(
    prop =>
      prop.type !== 'TSExpressionWithTypeArguments' ||
      extendsForProp(prop, types) === null,
  );
}

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type PropsAST = Object;

function getExtendsProps(
  typeDefinition: $ReadOnlyArray<PropsAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<ExtendsPropsShape> {
  return typeDefinition
    .filter(prop => prop.type === 'TSExpressionWithTypeArguments')
    .map(prop => extendsForProp(prop, types))
    .filter(Boolean);
}

module.exports = {
  getExtendsProps,
  removeKnownExtends,
};
