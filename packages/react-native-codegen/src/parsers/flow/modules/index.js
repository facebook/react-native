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

import type {NativeModuleShape} from '../../../CodegenSchema';
const {getAliases} = require('./aliases');
const {getMethods} = require('./methods');

import type {TypeDeclarationMap} from '../utils';

function processModule(types: TypeDeclarationMap): NativeModuleShape {
  const properties = getMethods(types);
  const aliases = getAliases(types);
  return {aliases, properties};
}

module.exports = {
  processModule,
};
