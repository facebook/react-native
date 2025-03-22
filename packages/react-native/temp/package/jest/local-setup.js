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

require('./setup');

const consoleError = console.error;
const consoleWarn = console.warn;

console.error = (...args) => {
  consoleError(...args);
  throw new Error('console.error() was called (see error above)');
};

console.warn = (...args) => {
  consoleWarn(...args);
  throw new Error('console.warn() was called (see warning above)');
};
