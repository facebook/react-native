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

const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');

if (__DEV__) {
  if (typeof global.Promise !== 'function') {
    console.error('Promise should exist before setting up timers.');
  }
}

// Currently, Hermes `Promise` is implemented via Internal Bytecode.
const hasHermesPromiseQueuedToJSVM =
  global?.HermesInternal?.hasPromise?.() &&
  global?.HermesInternal?.useEngineQueue?.();

// In bridgeless mode, timers are host functions installed from cpp.
if (!global.RN$Bridgeless) {
  /**
   * Set up timers.
   * You can use this module directly, or just require InitializeCore.
   */
  const defineLazyTimer = name => {
    polyfillGlobal(name, () => require('./Timers/JSTimers')[name]);
  };
  defineLazyTimer('setTimeout');
  defineLazyTimer('clearTimeout');
  defineLazyTimer('setInterval');
  defineLazyTimer('clearInterval');
  defineLazyTimer('requestAnimationFrame');
  defineLazyTimer('cancelAnimationFrame');
  defineLazyTimer('requestIdleCallback');
  defineLazyTimer('cancelIdleCallback');

  /**
   * Set up immediate APIs as aliases to the ReactNativeMicrotask APIs.
   */
  polyfillGlobal(
    'setImmediate',
    () => require('./Timers/JSTimers').queueReactNativeMicrotask,
  );
  polyfillGlobal(
    'clearImmediate',
    () => require('./Timers/JSTimers').clearReactNativeMicrotask,
  );
}

/**
 * Set up the microtask queueing API, which is required to use the same
 * microtask queue as the Promise.
 */
if (hasHermesPromiseQueuedToJSVM) {
  // Fast path for Hermes.
  polyfillGlobal('queueMicrotask', () => global.HermesInternal.enqueueJob);
} else {
  // Polyfill it with promise (regardless it's polyfiled or native) otherwise.
  polyfillGlobal(
    'queueMicrotask',
    () => require('./Timers/queueMicrotask.js').default,
  );
}
