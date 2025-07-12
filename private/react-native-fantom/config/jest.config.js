/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const baseConfig = require('../../../jest.config');
const path = require('path');

const isCI =
  Boolean(process.env.SANDCASTLE) || Boolean(process.env.GITHUB_ACTIONS);

// In CI, we want to prewarm the caches/builds before running the tests so
// that time isn't attributed to the first test that runs.
const globalSetup /*: ?string */ = isCI
  ? '<rootDir>/private/react-native-fantom/runner/warmup/index.js'
  : null;

module.exports = {
  rootDir: path.resolve(__dirname, '../../..') /*:: as string */,
  roots: [
    '<rootDir>/packages/react-native',
    '<rootDir>/packages/rn-tester',
    '<rootDir>/packages/polyfills',
    '<rootDir>/private/react-native-fantom',
  ],
  moduleFileExtensions: [
    ...baseConfig.moduleFileExtensions,
    'cpp',
    'h',
  ] /*:: as $ReadOnlyArray<string> */,
  // This allows running Meta-internal tests with the `-test.fb.js` suffix.
  testRegex: '/__tests__/.*-itest(\\.fb)?\\.js$',
  testPathIgnorePatterns: baseConfig.testPathIgnorePatterns,
  transformIgnorePatterns: ['.*'],
  testRunner: '<rootDir>/private/react-native-fantom/runner/index.js',
  watchPathIgnorePatterns: ['<rootDir>/private/react-native-fantom/build/'],
  globalSetup,
};
