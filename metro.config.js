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
const getPolyfills = require('./rn-get-polyfills');

const fs = require('fs');
/**
 * This cli config is needed for development purposes, e.g. for running
 * integration tests during local development or on CI services.
 */

// In sdx repo we need to use metro-resources to handle all the rush symlinking
if (
  fs.existsSync(path.resolve(__dirname, '../../scripts/metro-resources.js'))
) {
  const sdxHelpers = require('../../scripts/metro-resources');

  module.exports = sdxHelpers.createConfig({
    extraNodeModules: {
      'react-native': __dirname,
    },
    roots: [path.resolve(__dirname)],
    projectRoot: path.resolve(__dirname, '../../'),

    serializer: {
      getModulesRunBeforeMainModule: () => [
        require.resolve('./Libraries/Core/InitializeCore'),
      ],
      getPolyfills,
    },
    resolver: {
      platforms: ['ios', 'macos', 'android'],
    },
    transformer: {
      assetRegistryPath: require.resolve('./Libraries/Image/AssetRegistry'),
    },
  });
} else {
  module.exports = {
    serializer: {
      getModulesRunBeforeMainModule: () => [
        require.resolve('./Libraries/Core/InitializeCore'),
      ],
      getPolyfills,
    },
    resolver: {
      platforms: ['ios', 'macos', 'android'],
      extraNodeModules: {
        'react-native': __dirname,
      },
    },
    transformer: {
      assetRegistryPath: require.resolve('./Libraries/Image/AssetRegistry'),
    },
  };
}
