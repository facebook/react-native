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

import type {SchemaType} from '../../CodegenSchema.js';
// $FlowFixMe there's no flowtype flow-parser
const flowParser = require('flow-parser');
const fs = require('fs');
const {buildModuleSchema} = require('./modules/schema');
const {buildComponentSchema} = require('./components/schema');
const {processComponent} = require('./components');
const {processModule} = require('./modules');

function getTypes(ast) {
  return ast.body.reduce((types, node) => {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration.type !== 'VariableDeclaration') {
        types[node.declaration.id.name] = node.declaration;
      }
    } else if (
      node.type === 'TypeAlias' ||
      node.type === 'InterfaceDeclaration'
    ) {
      types[node.id.name] = node;
    }
    return types;
  }, {});
}

function getConfigType(ast): 'module' | 'component' {
  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );
  if (defaultExports.length !== 1) {
    throw new Error('File should contain only one default export.');
  }
  if (defaultExports[0].declaration && defaultExports[0].declaration.callee) {
    const statement = defaultExports[0].declaration.callee;
    if (statement.name === 'codegenNativeComponent') {
      return 'component';
    }
    if (statement.object && statement.object.name === 'TurboModuleRegistry') {
      return 'module';
    }
  }
  throw new Error(
    `Default export for module specified incorrectly. It should containts
    either "TurboModuleRegistry.getEnforcing" or "codegenNativeComponent".`,
  );
}

function buildSchema(contents: string): ?SchemaType {
  const ast = flowParser.parse(contents);

  const configType = getConfigType(ast);

  const types = getTypes(ast);

  if (configType === 'component') {
    return buildComponentSchema(processComponent(ast, types));
  } else {
    return buildModuleSchema(processModule(ast, types));
  }
}

function parseFile(filename: string): ?SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(contents);
}

function parseString(contents: string): ?SchemaType {
  return buildSchema(contents);
}

module.exports = {
  parseFile,
  parseString,
};
