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

const config = {
  projectRoot: path.resolve(__dirname, '../../..'),
  reporter: {
    update: () => {},
  },
  resolver: {
    blockList: null,
    sourceExts: [...rnTesterConfig.resolver.sourceExts, 'fb.js'],
    nodeModulesPaths: process.env.JS_DIR
      ? [path.join(process.env.JS_DIR, 'public', 'node_modules')]
      : [],
  },
  transformer: {
    // We need to wrap the default transformer so we can run it from source
    // using babel-register.
    babelTransformerPath: path.resolve(__dirname, 'metro-babel-transformer.js'),
  },
  watchFolders: process.env.JS_DIR ? [process.env.JS_DIR] : [],
};

module.exports = mergeConfig(rnTesterConfig, config);
