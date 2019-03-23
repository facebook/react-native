/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
'use strict';

/**
 * Sets up global variables for React Native.
 * You can use this module directly, or just require InitializeCore.
 */
if (global.GLOBAL === undefined) {
  global.GLOBAL = global;
}

if (global.window === undefined) {
  global.window = global;
}

// Set up process
global.process = global.process || {};
global.process.env = global.process.env || {};
if (!global.process.env.NODE_ENV) {
  global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
}
