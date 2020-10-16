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
const invariant = require('invariant');

import type {TypeDeclarationMap} from './utils';

function getTypes(ast): TypeDeclarationMap {
  return ast.body.reduce((types, node) => {
    if (node.type === 'ExportNamedDeclaration' && node.exportKind === 'type') {
      if (
        node.declaration.type === 'TypeAlias' ||
        node.declaration.type === 'InterfaceDeclaration'
      ) {
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

function isModule(types: TypeDeclarationMap) {
  const declaredModuleNames: Array<string> = Object.keys(types).filter(
    (typeName: string) => {
      const declaration = types[typeName];
      return (
        declaration.type === 'InterfaceDeclaration' &&
        declaration.extends.length === 1 &&
        declaration.extends[0].type === 'InterfaceExtends' &&
        declaration.extends[0].id.name === 'TurboModule'
      );
    },
  );

  if (declaredModuleNames.length === 0) {
    return false;
  }

  if (declaredModuleNames.length > 1) {
    throw new Error(
      'File contains declarations of more than one module: ' +
        declaredModuleNames.join(', ') +
        '. Please declare exactly one module in this file.',
    );
  }

  return true;
}

function getConfigType(ast, types: TypeDeclarationMap): 'module' | 'component' {
  const isConfigAComponent = isComponent(ast);
  const isConfigAModule = isModule(types);

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

  const types = getTypes(ast);

  const configType = getConfigType(ast, types);

  if (configType === 'component') {
    return wrapComponentSchema(buildComponentSchema(ast, types));
  } else {
    if (filename === undefined || filename === null) {
      throw new Error('Filepath expected while parasing a module');
    }
    const moduleName = path.basename(filename).replace(/\.js$/, '');

    const regex = new RegExp(TURBO_MODULE_REGISTRY_REQUIRE_REGEX_STRING, 'g');
    let match = regex.exec(contents);

    const errorHeader = `Error while parsing Module '${moduleName}'`;

    if (match == null) {
      throw new Error(
        `${errorHeader}: No call to TurboModuleRegistry.get<Spec>('...') detected.`,
      );
    }

    const moduleRequires = [];
    while (match != null) {
      const resultGroups = match.groups;
      invariant(
        resultGroups != null,
        `Couldn't parse TurboModuleRegistry.(get|getEnforcing)<Spec> call in module '${moduleName}'.`,
      );

      if (!moduleRequires.includes(resultGroups.nativeModuleName)) {
        moduleRequires.push(resultGroups.nativeModuleName);
      }
      match = regex.exec(contents);
    }

    return wrapModuleSchema(
      buildModuleSchema(moduleName, moduleRequires, types),
      moduleName,
    );
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
