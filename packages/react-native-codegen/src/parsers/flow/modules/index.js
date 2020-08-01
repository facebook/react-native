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
const {getAliases} = require('./aliases');
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

function findAliasNames(types) {
  return Object.keys(types)
    .map(typeName => types[typeName])
    .filter(
      type =>
        type.type &&
        type.type === 'TypeAlias' &&
        type.right &&
        type.right.type === 'ObjectTypeAnnotation',
    )
    .map(type => type.id.name);
}

function getModuleAliases(types, aliasNames) {
  return aliasNames.map(aliasName => {
    if (types[aliasName] && types[aliasName].right) {
      return {[aliasName]: types[aliasName].right};
    }
    throw new Error(
      `Interface properties for "${aliasName}" has been specified incorrectly.`,
    );
  });
}

// $FlowFixMe there's no flowtype for AST
function processModule(types): NativeModuleSchemaBuilderConfig {
  const interfaceName = findInterfaceName(types);
  const moduleProperties = getModuleProperties(types, interfaceName);
  const properties = getMethods(moduleProperties, types);

  const aliasNames = findAliasNames(types);
  const moduleAliases = getModuleAliases(types, aliasNames);
  const aliases = getAliases(moduleAliases, types);

  return {aliases, properties};
}

module.exports = {
  processModule,
};
