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

import type {SchemaType} from '../../CodegenSchema.js';
import type {Parser} from '../parser';

// $FlowFixMe[untyped-import] Use flow-types for @babel/parser
const babelParser = require('@babel/parser');
const fs = require('fs');
const {
  buildSchemaFromConfigType,
  getConfigType,
  isModuleRegistryCall,
} = require('../utils');
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('./components/schema');
const {buildModuleSchema} = require('./modules');
const {TypeScriptParser} = require('./parser');

const parser = new TypeScriptParser();

function Visitor(infoMap: {isComponent: boolean, isModule: boolean}) {
  return {
    CallExpression(node: $FlowFixMe) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'codegenNativeComponent'
      ) {
        infoMap.isComponent = true;
      }

      if (isModuleRegistryCall(node)) {
        infoMap.isModule = true;
      }
    },

    TSInterfaceDeclaration(node: $FlowFixMe) {
      if (
        Array.isArray(node.extends) &&
        node.extends.some(
          extension => extension.expression.name === 'TurboModule',
        )
      ) {
        infoMap.isModule = true;
      }
    },
  };
}

function buildSchema(
  contents: string,
  filename: ?string,
  parser: Parser,
): SchemaType {
  // Early return for non-Spec JavaScript files
  if (
    !contents.includes('codegenNativeComponent') &&
    !contents.includes('TurboModule')
  ) {
    return {modules: {}};
  }

  const ast = babelParser.parse(contents, {
    sourceType: 'module',
    plugins: ['typescript'],
  }).program;

  const configType = getConfigType(ast, Visitor);

  return buildSchemaFromConfigType(
    configType,
    filename,
    ast,
    wrapComponentSchema,
    buildComponentSchema,
    buildModuleSchema,
    parser,
  );
}

function parseModuleFixture(filename: string): SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(contents, 'path/NativeSampleTurboModule.ts', parser);
}

function parseString(contents: string, filename: ?string): SchemaType {
  return buildSchema(contents, filename, parser);
}

module.exports = {
  buildSchema,
  parseModuleFixture,
  parseString,
};
