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
const {
  flattenProperties,
  getSchemaInfo,
  getTypeAnnotation,
} = require('./componentsUtils.js');

import type {StateTypeAnnotation, NamedShape} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../utils.js';

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type PropAST = Object;

function buildStateSchema(
  property: PropAST,
  types: TypeDeclarationMap,
): ?NamedShape<StateTypeAnnotation> {
  const info = getSchemaInfo(property, types);
  if (info == null) {
    return null;
  }
  const {name, optional, typeAnnotation, defaultValue, withNullDefault} = info;
  return {
    name,
    optional,
    typeAnnotation: getTypeAnnotation(
      name,
      typeAnnotation,
      defaultValue,
      withNullDefault,
      types,
      buildStateSchema,
    ),
  };
}

function getState(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<NamedShape<StateTypeAnnotation>> {
  return flattenProperties(typeDefinition, types)
    .map(property => buildStateSchema(property, types))
    .filter(Boolean);
}

module.exports = {
  getState,
};
