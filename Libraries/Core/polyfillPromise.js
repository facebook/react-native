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
const warnOnce = require('../Utilities/warnOnce');

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
  polyfillGlobal('Promise', () => require('../Promise'));
}

if (__DEV__) {
  // $FlowFixMe
  const done = Promise.prototype.done;
  if (done != null) {
    let depth = 0;
    /* eslint-disable no-extend-native */
    // $FlowFixMe
    Promise.prototype.done = function () {
      ++depth;
      try {
        // Avoid infinite recursion if done() happens to be triggered by warnOnce.
        if (depth === 1) {
          // Warn once per unique call stack. Not super efficient, but we're in
          // __DEV__ and .done() calls are rare to begin with.
          const key = new Error().stack;
          warnOnce(
            key,
            'Promise.prototype.done(): This nonstandard polyfill ' +
              'has been deprecated and will be removed in a future release. ' +
              'Please instead use `.then()`.',
          );
        }
      } finally {
        --depth;
      }
      return done.apply(this, arguments);
    };
    /* eslint-enable no-extend-native */
  }
}
