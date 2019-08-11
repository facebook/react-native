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
const path = require('path');
const {buildModuleSchema} = require('./modules/schema');
const {buildComponentSchema} = require('./components/schema');
const {processComponent} = require('./components');
const {processModule} = require('./modules');

function getTypes(ast) {
  return ast.body.reduce((types, node) => {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration && node.declaration.type !== 'VariableDeclaration') {
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

function getConfigType(ast, types): 'module' | 'component' {
  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );

  let isComponent = false;

  if (defaultExports.length > 0) {
    let declaration = defaultExports[0].declaration;
    // codegenNativeComponent can be nested inside a cast
    // expression so we need to go one level deeper
    if (declaration.type === 'TypeCastExpression') {
      declaration = declaration.expression;
    }

    isComponent =
      declaration &&
      declaration.callee &&
      declaration.callee.name === 'codegenNativeComponent';
  }

  const typesExtendingTurboModule = Object.keys(types)
    .map(typeName => types[typeName])
    .filter(
      type =>
        type.extends &&
        type.extends[0] &&
        type.extends[0].id.name === 'TurboModule',
    );

  if (typesExtendingTurboModule.length > 1) {
    throw new Error(
      'Found two types extending "TurboModule" is one file. Split them into separated files.',
    );
  }

  const isModule = typesExtendingTurboModule.length === 1;

  if (isModule && isComponent) {
    throw new Error(
      'Found type extending "TurboModule" and exported "codegenNativeComponent" declaration in one file. Split them into separated files.',
    );
  }

  if (isModule) {
    return 'module';
  } else if (isComponent) {
    return 'component';
  } else {
    throw new Error(
      `Default export for module specified incorrectly. It should containts
    either type extending "TurboModule" or "codegenNativeComponent".`,
    );
  }
}

function buildSchema(contents: string, filename: ?string): ?SchemaType {
  const ast = flowParser.parse(contents);

  const types = getTypes(ast);

  const configType = getConfigType(ast, types);

  if (configType === 'component') {
    return buildComponentSchema(processComponent(ast, types));
  } else {
    if (filename === undefined || filename === null) {
      throw new Error('Filepath expected while parasing a module');
    }
    const moduleName = path.basename(filename).slice(6, -3);
    return buildModuleSchema(processModule(types), moduleName);
  }
}

function parseFile(filename: string): ?SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(contents, filename);
}

function parseModuleFixture(filename: string): ?SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(contents, 'path/NativeSampleTurboModule.js');
}

function parseString(contents: string): ?SchemaType {
  return buildSchema(contents);
}

module.exports = {
  parseFile,
  parseModuleFixture,
  parseString,
};
