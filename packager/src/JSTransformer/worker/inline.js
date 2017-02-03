/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const babel = require('babel-core');
const invariant = require('fbjs/lib/invariant');

import type {Ast, SourceMap} from 'babel-core';
const t = babel.types;

const React = {name: 'React'};
const ReactNative = {name: 'ReactNative'};
const platform = {name: 'Platform'};
const os = {name: 'OS'};
const select = {name: 'select'};
const requirePattern = {name: 'require'};

const env = {name: 'env'};
const nodeEnv = {name: 'NODE_ENV'};
const processId = {name: 'process'};

const dev = {name: '__DEV__'};

const importMap = new Map([['ReactNative', 'react-native']]);

const isGlobal = (binding) => !binding;

const isToplevelBinding = (binding, isWrappedModule) =>
  isGlobal(binding) ||
  !binding.scope.parent ||
  isWrappedModule && !binding.scope.parent.parent;

const isRequireCall = (node, dependencyId, scope) =>
  t.isCallExpression(node) &&
  t.isIdentifier(node.callee, requirePattern) &&
  checkRequireArgs(node.arguments, dependencyId);

const isImport = (node, scope, patterns) =>
  patterns.some(pattern => {
    const importName = importMap.get(pattern.name) || pattern.name;
    return isRequireCall(node, importName, scope);
  });

function isImportOrGlobal(node, scope, patterns, isWrappedModule) {
  const identifier = patterns.find(pattern => t.isIdentifier(node, pattern));
  return (
    identifier &&
    isToplevelBinding(scope.getBinding(identifier.name), isWrappedModule) ||
    isImport(node, scope, patterns)
  );
}

const isPlatformOS = (node, scope, isWrappedModule) =>
  t.isIdentifier(node.property, os) &&
  isImportOrGlobal(node.object, scope, [platform], isWrappedModule);

const isReactPlatformOS = (node, scope, isWrappedModule) =>
  t.isIdentifier(node.property, os) &&
  t.isMemberExpression(node.object) &&
  t.isIdentifier(node.object.property, platform) &&
  isImportOrGlobal(
    node.object.object, scope, [React, ReactNative], isWrappedModule);

const isProcessEnvNodeEnv = (node, scope) =>
  t.isIdentifier(node.property, nodeEnv) &&
  t.isMemberExpression(node.object) &&
  t.isIdentifier(node.object.property, env) &&
  t.isIdentifier(node.object.object, processId) &&
  isGlobal(scope.getBinding(processId.name));

const isPlatformSelect = (node, scope, isWrappedModule) =>
  t.isMemberExpression(node.callee) &&
  t.isIdentifier(node.callee.object, platform) &&
  t.isIdentifier(node.callee.property, select) &&
  isImportOrGlobal(node.callee.object, scope, [platform], isWrappedModule);

const isReactPlatformSelect = (node, scope, isWrappedModule) =>
  t.isMemberExpression(node.callee) &&
  t.isIdentifier(node.callee.property, select) &&
  t.isMemberExpression(node.callee.object) &&
  t.isIdentifier(node.callee.object.property, platform) &&
  isImportOrGlobal(
    node.callee.object.object, scope, [React, ReactNative], isWrappedModule);

const isDev = (node, parent, scope) =>
  t.isIdentifier(node, dev) &&
  isGlobal(scope.getBinding(dev.name)) &&
  !(t.isMemberExpression(parent));

function findProperty(objectExpression, key) {
  const property = objectExpression.properties.find(p => p.key.name === key);
  return property ? property.value : t.identifier('undefined');
}

const inlinePlugin = {
  visitor: {
    Identifier(path, state) {
      if (isDev(path.node, path.parent, path.scope)) {
        path.replaceWith(t.booleanLiteral(state.opts.dev));
      }
    },
    MemberExpression(path, state) {
      const node = path.node;
      const scope = path.scope;
      const opts = state.opts;

      if (
        isPlatformOS(node, scope, opts.isWrapped) ||
        isReactPlatformOS(node, scope, opts.isWrapped)
      ) {
        path.replaceWith(t.stringLiteral(opts.platform));
      } else if (isProcessEnvNodeEnv(node, scope)) {
        path.replaceWith(
          t.stringLiteral(opts.dev ? 'development' : 'production'));
      }
    },
    CallExpression(path, state) {
      const node = path.node;
      const scope = path.scope;
      const arg = node.arguments[0];
      const opts = state.opts;

      if (
        isPlatformSelect(node, scope, opts.isWrapped) ||
        isReactPlatformSelect(node, scope, opts.isWrapped)
      ) {
        const replacement = t.isObjectExpression(arg)
          ? findProperty(arg, opts.platform)
          : node;

        path.replaceWith(replacement);
      }
    }
  },
};

const plugin = () => inlinePlugin;

function checkRequireArgs(args, dependencyId) {
  const pattern = t.stringLiteral(dependencyId);
  return t.isStringLiteral(args[0], pattern) ||
         t.isMemberExpression(args[0]) &&
         t.isNumericLiteral(args[0].property) &&
         t.isStringLiteral(args[1], pattern);
}

type AstResult = {
  ast: Ast,
  code: ?string,
  map: ?SourceMap,
};

function inline(
  filename: string,
  transformResult: {ast?: ?Ast, code: string, map: ?SourceMap},
  options: {},
): AstResult {
  const code = transformResult.code;
  const babelOptions = {
    filename,
    plugins: [[plugin, options]],
    inputSourceMap: transformResult.map,
    sourceMaps: true,
    sourceFileName: filename,
    code: false,
    babelrc: false,
    compact: true,
  };

  const result = transformResult.ast
    ? babel.transformFromAst(transformResult.ast, code, babelOptions)
    : babel.transform(code, babelOptions);
  const {ast} = result;
  invariant(ast != null, 'Missing AST in babel transform results.');
  return {ast, code: result.code, map: result.map};
}

inline.plugin = inlinePlugin;
module.exports = inline;
