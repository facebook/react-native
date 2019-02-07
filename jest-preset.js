/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const dir = __dirname;

module.exports = {
  haste: {
    defaultPlatform: 'ios',
    platforms: ['android', 'ios', 'native'],
    hasteImplModulePath: require.resolve('./jest/hasteImpl.js'),
    providesModuleNodeModules: ['react-native'],
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],
  moduleNameMapper: {
    '^React$': require.resolve('react'),
  },
  modulePathIgnorePatterns: [`${dir}/Libraries/react-native/`],
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      './jest/assetFileTransformer.js',
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|react-clone-referenced-element)',
  ],
  testMatch: [
    '**/__tests__/**/*.(js|ts|tsx)',
    '**/?(*.)+(spec|test).(js|ts|tsx)',
  ],
  setupFiles: [require.resolve('./jest/setup.js')],
  testEnvironment: 'node',
};
