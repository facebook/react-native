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

import type {ComponentSchemaBuilderConfig} from './flow/components/schema';
import type {NativeModuleSchema, SchemaType} from '../CodegenSchema';
const {ParserError} = require('./errors');
const {wrapModuleSchema} = require('./parsers-commons');

const fs = require('fs');
const path = require('path');
const invariant = require('invariant');

export type TypeDeclarationMap = {[declarationName: string]: $FlowFixMe};

export type TypeAliasResolutionStatus =
  | $ReadOnly<{
      successful: true,
      aliasName: string,
    }>
  | $ReadOnly<{
      successful: false,
    }>;

function extractNativeModuleName(filename: string): string {
  // this should drop everything after the file name. For Example it will drop:
  // .android.js, .android.ts, .android.tsx, .ios.js, .ios.ts, .ios.tsx, .js, .ts, .tsx
  return path.basename(filename).split('.')[0];
}

export type ParserErrorCapturer = <T>(fn: () => T) => ?T;

function createParserErrorCapturer(): [
  Array<ParserError>,
  ParserErrorCapturer,
] {
  const errors = [];
  function guard<T>(fn: () => T): ?T {
    try {
      return fn();
    } catch (error) {
      if (!(error instanceof ParserError)) {
        throw error;
      }
      errors.push(error);

      return null;
    }
  }

  return [errors, guard];
}

function verifyPlatforms(
  hasteModuleName: string,
  moduleNames: string[],
): $ReadOnly<{
  cxxOnly: boolean,
  excludedPlatforms: Array<'iOS' | 'android'>,
}> {
  let cxxOnly = false;
  const excludedPlatforms = new Set<'iOS' | 'android'>();
  const namesToValidate = [...moduleNames, hasteModuleName];

  namesToValidate.forEach(name => {
    if (name.endsWith('Android')) {
      excludedPlatforms.add('iOS');
      return;
    }

    if (name.endsWith('IOS')) {
      excludedPlatforms.add('android');
      return;
    }

    if (name.endsWith('Cxx')) {
      cxxOnly = true;
      excludedPlatforms.add('iOS');
      excludedPlatforms.add('android');
      return;
    }
  });

  return {
    cxxOnly,
    excludedPlatforms: Array.from(excludedPlatforms),
  };
}

function parseFile(
  filename: string,
  callback: (contents: string, filename: string) => SchemaType,
): SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return callback(contents, filename);
}

// TODO(T108222691): Use flow-types for @babel/parser
function visit(
  astNode: $FlowFixMe,
  visitor: {
    [type: string]: (node: $FlowFixMe) => void,
  },
) {
  const queue = [astNode];
  while (queue.length !== 0) {
    let item = queue.shift();

    if (!(typeof item === 'object' && item != null)) {
      continue;
    }

    if (
      typeof item.type === 'string' &&
      typeof visitor[item.type] === 'function'
    ) {
      // Don't visit any children
      visitor[item.type](item);
    } else if (Array.isArray(item)) {
      queue.push(...item);
    } else {
      queue.push(...Object.values(item));
    }
  }
}

function buildSchemaFromConfigType(
  configType: 'module' | 'component' | 'none',
  filename: ?string,
  ast: $FlowFixMe,
  wrapComponentSchema: (config: ComponentSchemaBuilderConfig) => SchemaType,
  buildComponentSchema: (ast: $FlowFixMe) => ComponentSchemaBuilderConfig,
  buildModuleSchema: (
    hasteModuleName: string,
    ast: $FlowFixMe,
    tryParse: ParserErrorCapturer,
  ) => NativeModuleSchema,
): SchemaType {
  switch (configType) {
    case 'component': {
      return wrapComponentSchema(buildComponentSchema(ast));
    }
    case 'module': {
      if (filename === undefined || filename === null) {
        throw new Error('Filepath expected while parasing a module');
      }
      const nativeModuleName = extractNativeModuleName(filename);

      const [parsingErrors, tryParse] = createParserErrorCapturer();

      const schema = tryParse(() =>
        buildModuleSchema(nativeModuleName, ast, tryParse),
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

      return wrapModuleSchema(schema, nativeModuleName);
    }
    default:
      return {modules: {}};
  }
}

function getConfigType(
  // TODO(T71778680): Flow-type this node.
  ast: $FlowFixMe,
  Visitor: ({isComponent: boolean, isModule: boolean}) => {
    [type: string]: (node: $FlowFixMe) => void,
  },
): 'module' | 'component' | 'none' {
  let infoMap = {
    isComponent: false,
    isModule: false,
  };

  visit(ast, Visitor(infoMap));

  const {isModule, isComponent} = infoMap;
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

// TODO(T71778680): Flow-type ASTNodes.
function isModuleRegistryCall(node: $FlowFixMe): boolean {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callExpression = node;

  if (callExpression.callee.type !== 'MemberExpression') {
    return false;
  }

  const memberExpression = callExpression.callee;
  if (
    !(
      memberExpression.object.type === 'Identifier' &&
      memberExpression.object.name === 'TurboModuleRegistry'
    )
  ) {
    return false;
  }

  if (
    !(
      memberExpression.property.type === 'Identifier' &&
      (memberExpression.property.name === 'get' ||
        memberExpression.property.name === 'getEnforcing')
    )
  ) {
    return false;
  }

  if (memberExpression.computed) {
    return false;
  }

  return true;
}

module.exports = {
  getConfigType,
  extractNativeModuleName,
  createParserErrorCapturer,
  verifyPlatforms,
  parseFile,
  visit,
  buildSchemaFromConfigType,
  isModuleRegistryCall,
};
