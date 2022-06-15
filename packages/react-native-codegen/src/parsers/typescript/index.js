/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {SchemaType} from '../../CodegenSchema.js';
const babelParser = require('@babel/parser');
const fs = require('fs');
const path = require('path');
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('./components/schema');
const {buildModuleSchema} = require('./modules');
const {wrapModuleSchema} = require('./modules/schema');

const {
  createParserErrorCapturer,
  visit,
  isModuleRegistryCall,
} = require('./utils');
const invariant = require('invariant');

function getConfigType(
  // TODO(T108222691): Use flow-types for @babel/parser
  ast: $FlowFixMe,
): 'module' | 'component' | 'none' {
  let isComponent = false;
  let isModule = false;

  visit(ast, {
    CallExpression(node) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'codegenNativeComponent'
      ) {
        isComponent = true;
      }

      if (isModuleRegistryCall(node)) {
        isModule = true;
      }
    },

    TSInterfaceDeclaration(node) {
      if (
        Array.isArray(node.extends) &&
        node.extends.some(
          extension => extension.expression.name === 'TurboModule',
        )
      ) {
        isModule = true;
      }
    },
  });

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
    return 'none';
  }
}

function buildSchema(contents: string, filename: ?string): SchemaType {
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

  const configType = getConfigType(ast);

  switch (configType) {
    case 'component': {
      return wrapComponentSchema(buildComponentSchema(ast));
    }
    case 'module': {
      if (filename === undefined || filename === null) {
        throw new Error('Filepath expected while parasing a module');
      }
      const hasteModuleName = path.basename(filename).replace(/\.tsx?$/, '');

      const [parsingErrors, tryParse] = createParserErrorCapturer();

      const schema = tryParse(() =>
        buildModuleSchema(hasteModuleName, ast, tryParse),
      );

      if (parsingErrors.length > 0) {
        /**
         * TODO(T77968131): We have two options:
         *  - Throw the first error, but indicate there are more then one errors.
         *  - Display all errors, nicely formatted.
         *
         * For the time being, we're just throw the first error.
         **/

        throw parsingErrors[0];
      }

      invariant(
        schema != null,
        'When there are no parsing errors, the schema should not be null',
      );

      return wrapModuleSchema(schema, hasteModuleName);
    }
    default:
      return {modules: {}};
  }
}

function parseFile(filename: string): SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(contents, filename);
}

function parseModuleFixture(filename: string): SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(contents, 'path/NativeSampleTurboModule.ts');
}

function parseString(contents: string, filename: ?string): SchemaType {
  return buildSchema(contents, filename);
}

module.exports = {
  parseFile,
  parseModuleFixture,
  parseString,
};
