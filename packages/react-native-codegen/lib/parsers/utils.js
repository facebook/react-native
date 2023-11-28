/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const _require = require('./errors'),
  ParserError = _require.ParserError;
const path = require('path');
function extractNativeModuleName(filename) {
  // this should drop everything after the file name. For Example it will drop:
  // .android.js, .android.ts, .android.tsx, .ios.js, .ios.ts, .ios.tsx, .js, .ts, .tsx
  return path.basename(filename).split('.')[0];
}

// $FlowFixMe[unclear-type] there's no flowtype for ASTs

// $FlowFixMe[unclear-type] there's no flowtype for ASTs

function createParserErrorCapturer() {
  // $FlowFixMe[missing-empty-array-annot]
  const errors = [];
  function guard(fn) {
    try {
      return fn();
    } catch (error) {
      if (!(error instanceof ParserError)) {
        throw error;
      }
      // $FlowFixMe[incompatible-call]
      errors.push(error);
      return null;
    }
  }

  // $FlowFixMe[incompatible-return]
  return [errors, guard];
}
function verifyPlatforms(hasteModuleName, moduleName) {
  let cxxOnly = false;
  const excludedPlatforms = new Set();
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
function visit(astNode, visitor) {
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
  ast,
  Visitor,
) {
  let infoMap = {
    isComponent: false,
    isModule: false,
  };
  visit(ast, Visitor(infoMap));
  const isModule = infoMap.isModule,
    isComponent = infoMap.isComponent;
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
function isModuleRegistryCall(node) {
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
  visit,
  isModuleRegistryCall,
};
