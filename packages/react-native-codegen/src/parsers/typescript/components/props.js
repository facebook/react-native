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

const {buildPropSchema} = require('../../parsers-commons');

import type {NamedShape, PropTypeAnnotation} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../../utils';

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type PropAST = Object;

function getProps(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<NamedShape<PropTypeAnnotation>> {
  return typeDefinition.map(property =>
    buildPropSchema(property, types, 'Typescript'),
  );
}

module.exports = {
  getProps,
};
