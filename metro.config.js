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

const getPolyfills = require('./rn-get-polyfills');

/**
 * This cli config is needed for development purposes, e.g. for running
 * integration tests during local development or on CI services.
 */
const config = {
  serializer: {
    getPolyfills,
  },
  resolver: {
    platforms: ['ios', 'macos', 'android'],
    extraNodeModules: {
      'react-native': __dirname,
    },
    blacklistRE: [/android-patches\/.*/],
  },
  transformer: {},
};

// In scripts/run-ci-e2e-tests.js this file gets copied to a new app, in which
// case these settings do not apply.
if (!process.env.REACT_NATIVE_RUNNING_E2E_TESTS) {
  const InitializeCore = require.resolve('./Libraries/Core/InitializeCore');
  const AssetRegistry = require.resolve('./Libraries/Image/AssetRegistry');
  config.serializer.getModulesRunBeforeMainModule = () => [InitializeCore];
  config.transformer.assetRegistryPath = AssetRegistry;
}

module.exports = config;
