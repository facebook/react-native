/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

  let config = sdxHelpers.createConfig({
    extraNodeModules: {
      '@microsoft/react-native': __dirname,
    },

    roots: [path.resolve(__dirname)],
    projectRoot: __dirname,

    getPolyfills,
  });

  config.resolver.extraNodeModules[
    'react-native/Libraries/Image/AssetRegistry'
  ] = path.resolve(__dirname, 'Libraries/Image/AssetRegistry.js');
  module.exports = config;
} else {
  module.exports = {
    getPolyfills,

    resolver: {
      extraNodeModules: {
        'react-native': __dirname,
        'react-native/Libraries/Image/AssetRegistry': path.resolve(
          __dirname,
          'Libraries/Image/AssetRegistry',
        ),
      },
      platforms: ['win32', 'macos', 'android', 'uwp', 'windesktop'],
    },
  };
}
