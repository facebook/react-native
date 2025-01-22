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

if (__DEV__) {
  if (typeof global.Promise !== 'function') {
    console.error('Promise should exist before setting up timers.');
  }
}

// In bridgeless mode, timers are host functions installed from cpp.
if (global.RN$Bridgeless === true) {
  polyfillGlobal(
    'requestIdleCallback',
    () =>
      require('../../src/private/webapis/idlecallbacks/specs/NativeIdleCallbacks')
        .default.requestIdleCallback,
  );

  polyfillGlobal(
    'cancelIdleCallback',
    () =>
      require('../../src/private/webapis/idlecallbacks/specs/NativeIdleCallbacks')
        .default.cancelIdleCallback,
  );

  // This is the flag that tells React to use `queueMicrotask` to batch state
  // updates, instead of using the scheduler to schedule a regular task.
  // We use a global variable because we don't currently have any other
  // mechanism to pass feature flags from RN to React in OSS.
  global.RN$enableMicrotasksInReact = true;

  polyfillGlobal(
    'queueMicrotask',
    () =>
      require('../../src/private/webapis/microtasks/specs/NativeMicrotasks')
        .default.queueMicrotask,
  );

  // We shim the immediate APIs via `queueMicrotask` to maintain the backward
  // compatibility.
  polyfillGlobal(
    'setImmediate',
    () => require('./Timers/immediateShim').setImmediate,
  );
  polyfillGlobal(
    'clearImmediate',
    () => require('./Timers/immediateShim').clearImmediate,
  );
} else {
  /**
   * Set up timers.
   * You can use this module directly, or just require InitializeCore.
   */
  const defineLazyTimer = (
    name:
      | 'cancelAnimationFrame'
      | 'cancelIdleCallback'
      | 'clearInterval'
      | 'clearTimeout'
      | 'requestAnimationFrame'
      | 'requestIdleCallback'
      | 'setInterval'
      | 'setTimeout',
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

  // Polyfill it with promise (regardless it's polyfilled or native) otherwise.
  polyfillGlobal(
    'queueMicrotask',
    () => require('./Timers/queueMicrotask.js').default,
  );

  // When promise was polyfilled hence is queued to the RN microtask queue,
  // we polyfill the immediate APIs as aliases to the ReactNativeMicrotask APIs.
  // Note that in bridgeless mode, immediate APIs are installed from cpp.
  polyfillGlobal(
    'setImmediate',
    () => require('./Timers/JSTimers').queueReactNativeMicrotask,
  );
  polyfillGlobal(
    'clearImmediate',
    () => require('./Timers/JSTimers').clearReactNativeMicrotask,
  );
}
