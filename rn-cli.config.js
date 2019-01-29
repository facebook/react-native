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
module.exports = {
  extraNodeModules: {
    'react-native': __dirname,
  },
  serializer: {
    getModulesRunBeforeMainModule: () => [
      require.resolve('./Libraries/Core/InitializeCore'),
    ],
    getPolyfills,
  },
  resolver: {
    hasteImplModulePath: require.resolve('./jest/hasteImpl'),
  },
  transformer: {
    assetRegistryPath: require.resolve('./Libraries/Image/AssetRegistry'),
  },
};
