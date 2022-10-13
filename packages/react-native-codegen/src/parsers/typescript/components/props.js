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
const {getSchemaInfo, getTypeAnnotation} = require('./componentsUtils.js');

import type {
  NamedShape,
  StateTypeAnnotation,
  PropTypeAnnotation,
} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../../utils';

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type PropAST = Object;

function buildPropSchema<T>(
  property: PropAST,
  types: TypeDeclarationMap,
): NamedShape<T> {
  const info = getSchemaInfo(property, types);
  const {name, optional, typeAnnotation, defaultValue} = info;
  return {
    name,
    optional,
    typeAnnotation: getTypeAnnotation(
      name,
      typeAnnotation,
      defaultValue,
      types,
      buildPropSchema,
    ),
  };
}

function getProps(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<NamedShape<PropTypeAnnotation>> {
  return typeDefinition.map(property =>
    buildPropSchema<PropTypeAnnotation>(property, types),
  );
}

function getState(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<NamedShape<StateTypeAnnotation>> {
  return typeDefinition.map(property =>
    buildPropSchema<StateTypeAnnotation>(property, types),
  );
}

module.exports = {
  getProps,
  getState,
};
