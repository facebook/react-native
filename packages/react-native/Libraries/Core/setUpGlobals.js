/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use client';
'use strict';

/**
 * Sets up global variables for React Native.
 * You can use this module directly, or just require InitializeCore.
 */
if (global.window === undefined) {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  global.window = global;
}

if (global.self === undefined) {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  global.self = global;
}

// Set up process
// $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
global.process = global.process || {};
// $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
global.process.env = global.process.env || {};
if (!global.process.env.NODE_ENV) {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
}
