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

const {ParserError} = require('./errors');
const fs = require('fs');
const path = require('path');

export type TypeDeclarationMap = {[declarationName: string]: $FlowFixMe};

export type TypeResolutionStatus =
  | Readonly<{
      type: 'alias' | 'enum',
      successful: true,
      name: string,
    }>
  | Readonly<{
      successful: false,
    }>;

function extractNativeModuleName(filename: string): string {
  // this should drop everything after the file name. For Example it will drop:
  // .android.js, .android.ts, .android.tsx, .ios.js, .ios.ts, .ios.tsx, .js, .ts, .tsx
  return path.basename(filename).split('.')[0];
}

export type ParserErrorCapturer = <T>(fn: () => T) => ?T;

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
export type PropAST = Object;

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
export type ASTNode = Object;

function createParserErrorCapturer(): [
  Array<ParserError>,
  ParserErrorCapturer,
] {
  // $FlowFixMe[missing-empty-array-annot]
  const errors = [];
  function guard<T>(fn: () => T): ?T {
    try {
      return fn();
    } catch (error) {
      if (!(error instanceof ParserError)) {
        throw error;
      }
      // $FlowFixMe[incompatible-type]
      errors.push(error);

      return null;
    }
  }

  // $FlowFixMe[incompatible-type]
  return [errors, guard];
}

function verifyPlatforms(
  hasteModuleName: string,
  moduleName: string,
): Readonly<{
  cxxOnly: boolean,
  excludedPlatforms: Array<'iOS' | 'android'>,
}> {
  let cxxOnly = false;
  const excludedPlatforms = new Set<'iOS' | 'android'>();
  const namesToValidate = [moduleName, hasteModuleName];

  namesToValidate.forEach(name => {
    if (name.endsWith('Android')) {
      excludedPlatforms.add('iOS');
      return;
    }

    if (name.endsWith('IOS')) {
      excludedPlatforms.add('android');
      return;
    }

    if (name.endsWith('Windows')) {
      excludedPlatforms.add('iOS');
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

function getSortedObject<T>(unsortedObject: {[key: string]: T}): {
  [key: string]: T,
} {
  return Object.keys(unsortedObject)
    .sort()
    .reduce((sortedObject: {[key: string]: T}, key: string) => {
      sortedObject[key] = unsortedObject[key];
      return sortedObject;
    }, {});
}

export type ImportMap = {[importedName: string]: string};

/**
 * Extracts a map of imported type names to their source module names
 * from ImportDeclaration nodes in the AST. Only captures type imports
 * (import type {...} or inline type specifiers) to avoid unnecessary
 * filesystem I/O when resolving imported types.
 *
 * For example:
 *   import type {EnumInt2} from 'MyTypes';
 * produces:
 *   {EnumInt2: 'MyTypes'}
 */
function getImportsFromAST(ast: $FlowFixMe): ImportMap {
  const imports: ImportMap = {};
  for (const node of ast.body) {
    if (node.type !== 'ImportDeclaration') {
      continue;
    }
    // Skip pure value imports (importKind === 'value' with no type specifiers)
    const isTypeImport =
      node.importKind === 'type' || node.importKind === 'typeof';
    const source = node.source.value;
    for (const specifier of node.specifiers) {
      if (specifier.type === 'ImportSpecifier') {
        // Include if the whole declaration is a type import,
        // or if this specific specifier is a type import (TS inline type imports)
        if (isTypeImport || specifier.importKind === 'type') {
          const importedName = specifier.imported?.name ?? specifier.local.name;
          imports[importedName] = source;
        }
      }
    }
  }
  return imports;
}

/**
 * Resolves imported types from other files by reading the source files
 * and extracting their type declarations. Only resolves relative path imports;
 * framework imports (non-relative paths) are skipped.
 *
 * When a type is found in a source file, all types from that file are included
 * to handle transitive type dependencies (e.g., importing ProjectDetails which
 * references Package, both defined in the same source file).
 *
 * Note: This only follows one level of file imports. Transitive file imports
 * (A imports from B which imports from C) are not followed.
 */
function resolveImportedTypes(
  imports: ImportMap,
  currentFilename: string,
  extensions: Array<string>,
  getAst: (contents: string, filename?: ?string) => $FlowFixMe,
  getTypes: (ast: $FlowFixMe) => TypeDeclarationMap,
): TypeDeclarationMap | void {
  let importedTypes: TypeDeclarationMap = {};
  const currentDir = path.dirname(currentFilename);
  let found = false;

  for (const typeName of Object.keys(imports)) {
    const sourceModule = imports[typeName];

    // Skip framework imports (react-native, react, etc.)
    if (!sourceModule.startsWith('.') && !sourceModule.startsWith('/')) {
      continue;
    }

    // Resolve relative path
    let resolvedPath = null;
    const basePath = path.resolve(currentDir, sourceModule);

    for (const ext of extensions) {
      const candidate = basePath + ext;
      if (fs.existsSync(candidate)) {
        resolvedPath = candidate;
        break;
      }
    }

    // Try without extension (file may already have it)
    if (resolvedPath == null && fs.existsSync(basePath)) {
      resolvedPath = basePath;
    }

    if (resolvedPath == null) {
      continue;
    }

    try {
      const sourceContents = fs.readFileSync(resolvedPath, 'utf8');
      const sourceAst = getAst(sourceContents, resolvedPath);
      const sourceTypes = getTypes(sourceAst);
      if (sourceTypes[typeName] != null) {
        // Include all types from the source file, not just the directly
        // imported one. This handles transitive type dependencies within
        // the same file (e.g., importing ProjectDetails which references
        // Package, both defined in the same source file).
        importedTypes = {...importedTypes, ...sourceTypes};
        found = true;
      }
    } catch {
      // Skip files that fail to parse
      continue;
    }
  }

  return found ? importedTypes : undefined;
}

/**
 * Builds a map from imported type names to their source haste module names.
 * Uses extractNativeModuleName on the source path to derive the haste name.
 */
function buildImportedTypeSourceMap(imports: ImportMap): {[string]: string} {
  const sourceMap: {[string]: string} = {};
  for (const typeName of Object.keys(imports)) {
    const sourcePath = imports[typeName];
    // Extract the haste module name from the source path
    const hasteName = extractNativeModuleName(sourcePath);
    sourceMap[typeName] = hasteName;
  }
  return sourceMap;
}

module.exports = {
  getConfigType,
  extractNativeModuleName,
  createParserErrorCapturer,
  verifyPlatforms,
  visit,
  isModuleRegistryCall,
  getSortedObject,
  getImportsFromAST,
  resolveImportedTypes,
  buildImportedTypeSourceMap,
};
