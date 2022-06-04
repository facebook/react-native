/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

module.exports = {
  transform: {
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      '<rootDir>/packages/react-native/jest/assetFileTransformer.js',
    '.*': './packages/react-native/jest/private/preprocessor.js',
  },
  setupFiles: ['./packages/react-native/jest/setup.js'],
  timers: 'fake',
  testRegex: '/__tests__/.*-test\\.js$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/template',
    'packages/react-native/Libraries/Renderer',
    'packages/rn-tester/e2e',
  ],
  transformIgnorePatterns: ['node_modules/(?!@react-native/)'],
  haste: {
    defaultPlatform: 'ios',
    platforms: ['ios', 'android'],
  },
  unmockedModulePathPatterns: [
    'node_modules/react/',
    'Libraries/Renderer',
    'promise',
    'source-map',
    'fastpath',
    'denodeify',
  ],
  testEnvironment: 'node',
  collectCoverageFrom: ['Libraries/**/*.js'],
  coveragePathIgnorePatterns: [
    '/__tests__/',
    '/vendor/',
    '<rootDir>/packages/react-native/Libraries/react-native/',
  ],
};
