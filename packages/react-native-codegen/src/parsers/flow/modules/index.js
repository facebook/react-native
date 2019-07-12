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

import type {NativeModuleSchemaBuilderConfig} from './schema.js';
const {getMethods} = require('./methods');

function getModuleProperties(types, interfaceName) {
  if (types[interfaceName] && types[interfaceName].body) {
    return types[interfaceName].body.properties;
  }
  throw new Error(
    `Interface properties for "${interfaceName}" has been specified incorrectly.`,
  );
}

function findInterfaceName(types) {
  return Object.keys(types)
    .map(typeName => types[typeName])
    .filter(
      type =>
        type.extends &&
        type.extends[0] &&
        type.extends[0].id.name === 'TurboModule',
    )[0].id.name;
}

// $FlowFixMe there's no flowtype for AST
function processModule(types): NativeModuleSchemaBuilderConfig {
  const interfaceName = findInterfaceName(types);

  const moduleProperties = getModuleProperties(types, interfaceName);
  const properties = getMethods(moduleProperties, types);
  return {properties};
}

module.exports = {
  processModule,
};
