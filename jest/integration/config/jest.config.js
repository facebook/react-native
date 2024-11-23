/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const baseConfig = require('../../../jest.config');
const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '../../..'),
  roots: [
    '<rootDir>/packages/react-native',
    '<rootDir>/jest/integration/runtime',
  ],
  moduleFileExtensions: [...baseConfig.moduleFileExtensions, 'cpp', 'h'],
  // This allows running Meta-internal tests with the `-test.fb.js` suffix.
  testRegex: '/__tests__/.*-itest(\\.fb)?\\.js$',
  testPathIgnorePatterns: baseConfig.testPathIgnorePatterns,
  transformIgnorePatterns: ['.*'],
  testRunner: './jest/integration/runner/index.js',
  watchPathIgnorePatterns: ['<rootDir>/jest/integration/build/'],
};
