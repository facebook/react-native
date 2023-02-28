/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// Global setup for tests local to the react-native repo. This setup is not
// included in the react-native Jest preset.

'use strict';

const consoleError = console.error;
const consoleWarn = console.warn;

jest.spyOn(console, 'debug').mockImplementation(() => {
  // Blackhole console output
});

jest.spyOn(console, 'info').mockImplementation(() => {
  // Blackhole console output
});

jest.spyOn(console, 'log').mockImplementation(() => {
  // Blackhole console output
});

jest.spyOn(console, 'error').mockImplementation((...args) => {
  consoleError(...args);
  throw new Error('console.error() was called');
});

jest.spyOn(console, 'warn').mockImplementation((...args) => {
  consoleWarn(...args);
  throw new Error('console.warn() was called');
});

require('./setup');
