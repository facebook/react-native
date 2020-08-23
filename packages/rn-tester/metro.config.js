/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const path = require('path');

const getPolyfills = require('react-native/rn-get-polyfills');

/**
 * This cli config is needed for development purposes, e.g. for running
 * integration tests during local development or on CI services.
 */
module.exports = {
  watchFolders: [
    `${path.resolve(__dirname, '..', '..', 'node_modules')}`,
    `${path.resolve(__dirname, '..')}`,
  ],
  resolver: {
    extraNodeModules: {
      'react-native': `${require.resolve('react-native')}`,
    },
  },
  serializer: {
    getPolyfills,
  },
};
