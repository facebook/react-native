/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');
const {isNativeFunction} = require('../Utilities/FeatureDetection');

if (__DEV__) {
  if (typeof global.Promise !== 'function') {
    console.error('Promise should exist before setting up timers.');
  }
}

// Currently, Hermes `Promise` is implemented via Internal Bytecode.
const hasHermesPromiseQueuedToJSVM =
  global.HermesInternal?.hasPromise?.() === true &&
  global.HermesInternal?.useEngineQueue?.() === true;

const hasNativePromise = isNativeFunction(Promise);
const hasPromiseQueuedToJSVM = hasNativePromise || hasHermesPromiseQueuedToJSVM;

// In bridgeless mode, timers are host functions installed from cpp.
if (global.RN$Bridgeless !== true) {
  /**
   * Set up timers.
   * You can use this module directly, or just require InitializeCore.
   */
  const defineLazyTimer = (
    name:
      | $TEMPORARY$string<'cancelAnimationFrame'>
      | $TEMPORARY$string<'cancelIdleCallback'>
      | $TEMPORARY$string<'clearInterval'>
      | $TEMPORARY$string<'clearTimeout'>
      | $TEMPORARY$string<'requestAnimationFrame'>
      | $TEMPORARY$string<'requestIdleCallback'>
      | $TEMPORARY$string<'setInterval'>
      | $TEMPORARY$string<'setTimeout'>,
  ) => {
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
}

/**
 * Set up immediate APIs, which is required to use the same microtask queue
 * as the Promise.
 */
if (hasPromiseQueuedToJSVM) {
  // When promise queues to the JSVM microtasks queue, we shim the immedaite
  // APIs via `queueMicrotask` to maintain the backward compatibility.
  polyfillGlobal(
    'setImmediate',
    () => require('./Timers/immediateShim').setImmediate,
  );
  polyfillGlobal(
    'clearImmediate',
    () => require('./Timers/immediateShim').clearImmediate,
  );
} else {
  // When promise was polyfilled hence is queued to the RN microtask queue,
  // we polyfill the immediate APIs as aliases to the ReactNativeMicrotask APIs.
  // Note that in bridgeless mode, immediate APIs are installed from cpp.
  if (global.RN$Bridgeless !== true) {
    polyfillGlobal(
      'setImmediate',
      () => require('./Timers/JSTimers').queueReactNativeMicrotask,
    );
    polyfillGlobal(
      'clearImmediate',
      () => require('./Timers/JSTimers').clearReactNativeMicrotask,
    );
  }
}

/**
 * Set up the microtask queueing API, which is required to use the same
 * microtask queue as the Promise.
 */
if (hasHermesPromiseQueuedToJSVM) {
  // Fast path for Hermes.
  polyfillGlobal('queueMicrotask', () => global.HermesInternal?.enqueueJob);
} else {
  // Polyfill it with promise (regardless it's polyfiled or native) otherwise.
  polyfillGlobal(
    'queueMicrotask',
    () => require('./Timers/queueMicrotask.js').default,
  );
}
