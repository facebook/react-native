/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const path = require('path');
const getPolyfills = require('../react-native/rn-get-polyfills');

/**
 * This cli config is needed for development purposes, e.g. for running
 * integration tests during local development or on CI services.
 */
module.exports = {
  // Make Metro able to resolve required external dependencies
  watchFolders: [
    path.resolve(__dirname, '../../node_modules'),
    path.resolve(__dirname, '../assets'),
    path.resolve(__dirname, '../normalize-color'),
    path.resolve(__dirname, '../polyfills'),
    path.resolve(__dirname, '../react-native'),
    path.resolve(__dirname, '../virtualized-lists'),
  ],
  resolver: {
    blockList: [/..\/react-native\/sdks\/hermes/],
    extraNodeModules: {
      'react-native': path.resolve(__dirname, '../react-native'),
    },
    platforms: ['ios', 'macos', 'android'], // [macOS]
  },
  serializer: {
    getPolyfills,
  },
};
