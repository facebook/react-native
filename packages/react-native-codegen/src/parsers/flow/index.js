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
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('./components/schema');
const {buildModuleSchema} = require('./modules');
const {wrapModuleSchema} = require('./modules/schema');
const {createParserErrorCapturer} = require('./utils');
const invariant = require('invariant');

function isComponent(ast) {
  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );

  if (defaultExports.length === 0) {
    return false;
  }

  let declaration = defaultExports[0].declaration;
  // codegenNativeComponent can be nested inside a cast
  // expression so we need to go one level deeper
  if (declaration.type === 'TypeCastExpression') {
    declaration = declaration.expression;
  }

  if (declaration.type !== 'CallExpression') {
    return false;
  }

  return (
    declaration.callee.type === 'Identifier' &&
    declaration.callee.name === 'codegenNativeComponent'
  );
}

function isModule(
  // TODO(T71778680): Flow-type this node.
  ast: $FlowFixMe,
) {
  const moduleInterfaces = ast.body
    .map(node => {
      if (
        node.type === 'ExportNamedDeclaration' &&
        node.exportKind === 'type' &&
        node.declaration.type === 'InterfaceDeclaration'
      ) {
        return node.declaration;
      }
      return node;
    })
    .filter(declaration => {
      return (
        declaration.type === 'InterfaceDeclaration' &&
        declaration.extends.length === 1 &&
        declaration.extends[0].type === 'InterfaceExtends' &&
        declaration.extends[0].id.name === 'TurboModule'
      );
    })
    .map(declaration => declaration.id.name);

  if (moduleInterfaces.length === 0) {
    return false;
  }

  if (moduleInterfaces.length > 1) {
    throw new Error(
      'File contains declarations of more than one module: ' +
        moduleInterfaces.join(', ') +
        '. Please declare exactly one module in this file.',
    );
  }

  return true;
}

function getConfigType(
  // TODO(T71778680): Flow-type this node.
  ast: $FlowFixMe,
): 'module' | 'component' {
  const isConfigAComponent = isComponent(ast);
  const isConfigAModule = isModule(ast);

  if (isConfigAModule && isConfigAComponent) {
    throw new Error(
      'Found type extending "TurboModule" and exported "codegenNativeComponent" declaration in one file. Split them into separated files.',
    );
  }

  if (isConfigAModule) {
    return 'module';
  } else if (isConfigAComponent) {
    return 'component';
  } else {
    throw new Error(
      'File neither contains a module declaration, nor a component declaration. ' +
        'For module declarations, please make sure your file has an InterfaceDeclaration extending TurboModule. ' +
        'For component declarations, please make sure your file has a default export calling the codegenNativeComponent<Props>(...) macro.',
    );
  }
}

const withSpace = (...args) => args.join('\\s*');
/**
 * Parse the TurboModuleRegistry.get(Enforcing)? call using RegExp.
 * Why? This call can appear anywhere in the NativeModule spec. Currently,
 * there is no good way of traversing the AST to find the MemberExpression
 * responsible for the call.
 */
const TURBO_MODULE_REGISTRY_REQUIRE_REGEX_STRING = withSpace(
  'TurboModuleRegistry',
  '\\.',
  'get(Enforcing)?',
  '<',
  'Spec',
  '>',
  '\\(',
  '[\'"](?<nativeModuleName>[A-Za-z$_0-9]+)[\'"]',
  ',?',
  '\\)',
);

function buildSchema(contents: string, filename: ?string): SchemaType {
  const ast = flowParser.parse(contents);

  const configType = getConfigType(ast);

  if (configType === 'component') {
    return wrapComponentSchema(buildComponentSchema(ast));
  } else {
    if (filename === undefined || filename === null) {
      throw new Error('Filepath expected while parasing a module');
    }
    const hasteModuleName = path.basename(filename).replace(/\.js$/, '');

    const regex = new RegExp(TURBO_MODULE_REGISTRY_REQUIRE_REGEX_STRING, 'g');
    let match = regex.exec(contents);

    const errorHeader = `Error while parsing Module '${hasteModuleName}'`;

    if (match == null) {
      throw new Error(
        `${errorHeader}: No call to TurboModuleRegistry.get<Spec>('...') detected.`,
      );
    }

    const moduleNames = [];
    while (match != null) {
      const resultGroups = match.groups;
      invariant(
        resultGroups != null,
        `Couldn't parse TurboModuleRegistry.(get|getEnforcing)<Spec> call in module '${hasteModuleName}'.`,
      );

      if (!moduleNames.includes(resultGroups.nativeModuleName)) {
        moduleNames.push(resultGroups.nativeModuleName);
      }
      match = regex.exec(contents);
    }

    const [parsingErrors, guard] = createParserErrorCapturer();

    const schema = guard(() =>
      buildModuleSchema(hasteModuleName, moduleNames, ast, guard),
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
}

function parseFile(filename: string): SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(contents, filename);
}

function parseModuleFixture(filename: string): SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(contents, 'path/NativeSampleTurboModule.js');
}

function parseString(contents: string, filename: ?string): SchemaType {
  return buildSchema(contents, filename);
}

module.exports = {
  parseFile,
  parseModuleFixture,
  parseString,
};
