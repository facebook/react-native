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

const react = {name: 'React'};
const platform = {name: 'Platform'};
const os = {name: 'OS'};
const requirePattern = {name: 'require'};

const env = {name: 'env'};
const nodeEnv = {name: 'NODE_ENV'};
const processId = {name: 'process'};

const dev = {name: '__DEV__'};

const isGlobal = (binding) => !binding;

const isToplevelBinding = (binding) => isGlobal(binding) || !binding.scope.parent;

const isRequireCall = (node, dependencyId, scope) =>
  t.isCallExpression(node) &&
  t.isIdentifier(node.callee, requirePattern) &&
  t.isStringLiteral(node.arguments[0], t.stringLiteral(dependencyId));

const isImport = (node, scope, pattern) =>
  t.isIdentifier(node, pattern) &&
  isToplevelBinding(scope.getBinding(pattern.name)) ||
  isRequireCall(node, pattern.name, scope);

const isPlatformOS = (node, scope) =>
  t.isIdentifier(node.property, os) &&
  isImport(node.object, scope, platform);

const isReactPlatformOS = (node, scope) =>
  t.isIdentifier(node.property, os) &&
  t.isMemberExpression(node.object) &&
  t.isIdentifier(node.object.property, platform) &&
  isImport(node.object.object, scope, react);

const isProcessEnvNodeEnv = (node, scope) =>
  t.isIdentifier(node.property, nodeEnv) &&
  t.isMemberExpression(node.object) &&
  t.isIdentifier(node.object.property, env) &&
  t.isIdentifier(node.object.object, processId) &&
  isGlobal(scope.getBinding(processId.name));

const isDev = (node, parent, scope) =>
  t.isIdentifier(node, dev) &&
  isGlobal(scope.getBinding(dev.name)) &&
  !(t.isMemberExpression(parent));

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
      }

      if(isProcessEnvNodeEnv(node, scope)) {
        path.replaceWith(
          t.stringLiteral(state.opts.dev ? 'development' : 'production'));
      }
    },
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
