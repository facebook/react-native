/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {getDefaultConfig} = require('@react-native/metro-config');
const {mergeConfig} = require('metro-config');
const path = require('path');

const rnTesterConfig = getDefaultConfig(
  path.resolve('../../../packages/rn-tester'),
);

const JS_DIR = process.env.JS_DIR
  ? path.resolve(process.cwd(), process.env.JS_DIR)
  : null;
const NODE_MODULES = path.sep + 'node_modules' + path.sep;

const config = {
  projectRoot: path.resolve(__dirname, '../../..'),
  reporter: {
    update: () => {},
  },
  resolver: {
    blockList: /\/RendererProxy\.fb\.js$/, // Disable dependency injection for the renderer
    sourceExts: ['fb.js', ...rnTesterConfig.resolver.sourceExts],
    nodeModulesPaths: JS_DIR
      ? [path.join(JS_DIR, 'public', 'node_modules')]
      : [],
    hasteImplModulePath: path.resolve(__dirname, 'hasteImpl.js'),
    resolveRequest: JS_DIR
      ? (ctx, dep, platform) =>
          ctx.originModulePath.includes(NODE_MODULES)
            ? ctx.resolveRequest(ctx, dep, platform)
            : // Disable hierarchical node_modules lookup from 1P code.
              ctx.resolveRequest(
                {...ctx, disableHierarchicalLookup: true},
                dep,
                platform,
              )
      : null,
  },
  transformer: {
    // We need to wrap the default transformer so we can run it from source
    // using babel-register.
    babelTransformerPath: path.resolve(__dirname, 'metro-babel-transformer.js'),
  },
  watchFolders: JS_DIR
    ? [
        path.join(JS_DIR, 'RKJSModules', 'vendor', 'react'),
        path.join(JS_DIR, 'tools', 'metro', 'packages', 'metro-runtime'),
        path.join(JS_DIR, 'public', 'node_modules'),
      ]
    : [],
};

module.exports = mergeConfig(rnTesterConfig, config);
