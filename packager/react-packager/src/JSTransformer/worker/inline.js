/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const babel = require('babel-core');
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

const isToplevelBinding = (binding) => isGlobal(binding) || !binding.scope.parent;

const isRequireCall = (node, dependencyId, scope) =>
  t.isCallExpression(node) &&
  t.isIdentifier(node.callee, requirePattern) &&
  t.isStringLiteral(node.arguments[0], t.stringLiteral(dependencyId));

const isImport = (node, scope, patterns) =>
  patterns.some(pattern => {
    const importName = importMap.get(pattern.name) || pattern.name;
    return isRequireCall(node, importName, scope);
  });

function isImportOrGlobal(node, scope, patterns) {
  const identifier = patterns.find(pattern => t.isIdentifier(node, pattern));
  return identifier && isToplevelBinding(scope.getBinding(identifier.name)) ||
         isImport(node, scope, patterns);
}

const isPlatformOS = (node, scope) =>
  t.isIdentifier(node.property, os) &&
  isImportOrGlobal(node.object, scope, [platform]);

const isReactPlatformOS = (node, scope) =>
  t.isIdentifier(node.property, os) &&
  t.isMemberExpression(node.object) &&
  t.isIdentifier(node.object.property, platform) &&
  isImportOrGlobal(node.object.object, scope, [React, ReactNative]);

const isProcessEnvNodeEnv = (node, scope) =>
  t.isIdentifier(node.property, nodeEnv) &&
  t.isMemberExpression(node.object) &&
  t.isIdentifier(node.object.property, env) &&
  t.isIdentifier(node.object.object, processId) &&
  isGlobal(scope.getBinding(processId.name));

const isPlatformSelect = (node, scope) =>
  t.isMemberExpression(node.callee) &&
  t.isIdentifier(node.callee.object, platform) &&
  t.isIdentifier(node.callee.property, select) &&
  isImportOrGlobal(node.callee.object, scope, [platform]);

const isReactPlatformSelect = (node, scope) =>
  t.isMemberExpression(node.callee) &&
  t.isIdentifier(node.callee.property, select) &&
  t.isMemberExpression(node.callee.object) &&
  t.isIdentifier(node.callee.object.property, platform) &&
  isImportOrGlobal(node.callee.object.object, scope, [React, ReactNative]);

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

      if (isPlatformOS(node, scope) || isReactPlatformOS(node, scope)) {
        path.replaceWith(t.stringLiteral(state.opts.platform));
      } else if (isProcessEnvNodeEnv(node, scope)) {
        path.replaceWith(
          t.stringLiteral(state.opts.dev ? 'development' : 'production'));
      }
    },
    CallExpression(path, state) {
      const node = path.node;
      const scope = path.scope;
      const arg = node.arguments[0];

      if (isPlatformSelect(node, scope) || isReactPlatformSelect(node, scope)) {
        const replacement = t.isObjectExpression(arg)
          ? findProperty(arg, state.opts.platform)
          : node;

        path.replaceWith(replacement);
      }
    }
  },
};

const plugin = () => inlinePlugin;

function inline(filename, transformResult, options) {
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

  return transformResult.ast
      ? babel.transformFromAst(transformResult.ast, code, babelOptions)
      : babel.transform(code, babelOptions);
}

module.exports = inline;
