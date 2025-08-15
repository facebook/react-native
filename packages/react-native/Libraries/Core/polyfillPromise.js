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

const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');

/**
 * Set up Promise. The native Promise implementation throws the following error:
 * ERROR: Event loop not supported.
 *
 * If you don't need these polyfills, don't use InitializeCore; just directly
 * require the modules you need from InitializeCore for setup.
 */

// If global.Promise is provided by Hermes, we are confident that it can provide
// all the methods needed by React Native, so we can directly use it.
if (global?.HermesInternal?.hasPromise?.()) {
  const HermesPromise = global.Promise;

  if (__DEV__) {
    if (typeof HermesPromise !== 'function') {
      console.error('HermesPromise does not exist');
    }
    global.HermesInternal?.enablePromiseRejectionTracker?.(
      require('../promiseRejectionTrackingOptions').default,
    );
  }
} else {
  polyfillGlobal('Promise', () => require('../Promise').default);
}
