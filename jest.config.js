/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

module.exports = {
    'transform': {
      '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': '<rootDir>/jest/assetFileTransformer.js',
      '.*': './jest/preprocessor.js',
    },
    'setupFiles': [
      './jest/setup.js',
    ],
    'timers': 'fake',
    'testRegex': '/__tests__/.*-test\\.js$',
    'testPathIgnorePatterns': [
      '/node_modules/',
      '<rootDir>/template',
      'Libraries/Renderer',
      'RNTester/e2e',
    ],
    'haste': {
      'defaultPlatform': 'ios',
      'platforms': [
        'ios',
        'android',
      ],
    },
    'unmockedModulePathPatterns': [
      'node_modules/react/',
      'Libraries/Renderer',
      'promise',
      'source-map',
      'fastpath',
      'denodeify',
      'fbjs',
    ],
    'testEnvironment': 'node',
    'collectCoverageFrom': [
      'Libraries/**/*.js',
    ],
    'coveragePathIgnorePatterns': [
      '/__tests__/',
      '/vendor/',
      '<rootDir>/Libraries/react-native/',
    ],
};
