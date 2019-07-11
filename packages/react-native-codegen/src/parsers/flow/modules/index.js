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
    `Interface properties for "${interfaceName} has been specified incorrectly."`,
  );
}

function findModuleConfig(
  ast,
): $ReadOnly<{|moduleName: string, interfaceName: string|}> {
  const defaultExport = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  )[0];
  try {
    const interfaceName =
      defaultExport.declaration.typeArguments.params[0].id.name;

    const moduleName = defaultExport.declaration.arguments[0].value;
    return {interfaceName, moduleName};
  } catch (e) {
    throw new Error(
      `Default export for module specified incorrectly. It should containts
      either "TurboModuleRegistry.getEnforcing" or "codegenNativeComponent".`,
    );
  }
}

// $FlowFixMe there's no flowtype for AST
function processModule(ast, types): NativeModuleSchemaBuilderConfig {
  const {interfaceName, moduleName} = findModuleConfig(ast);

  const moduleProperties = getModuleProperties(types, interfaceName);
  const properties = getMethods(moduleProperties, types);
  return {properties, filename: moduleName, moduleName};
}

module.exports = {
  processModule,
};
