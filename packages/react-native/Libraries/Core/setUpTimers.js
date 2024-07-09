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

const ReactNativeFeatureFlags = require('../../src/private/featureflags/ReactNativeFeatureFlags');
const NativeReactNativeFeatureFlags =
  require('../../src/private/featureflags/specs/NativeReactNativeFeatureFlags').default;
const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');

if (__DEV__) {
  if (typeof global.Promise !== 'function') {
    console.error('Promise should exist before setting up timers.');
  }
}

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
} else if (
  // TODO remove this condition when bridgeless == modern scheduler everywhere.
  NativeReactNativeFeatureFlags != null &&
  // eslint-disable-next-line react-hooks/rules-of-hooks -- false positive due to `use` prefix
  ReactNativeFeatureFlags.useModernRuntimeScheduler()
) {
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
}

// We need to check if the native module is available before accessing the
// feature flag, because otherwise the API would throw an error in the legacy
// architecture in OSS, where the native module isn't available.
if (
  NativeReactNativeFeatureFlags != null &&
  ReactNativeFeatureFlags.enableMicrotasks()
) {
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
  // Polyfill it with promise (regardless it's polyfilled or native) otherwise.
  polyfillGlobal(
    'queueMicrotask',
    () => require('./Timers/queueMicrotask.js').default,
  );

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
