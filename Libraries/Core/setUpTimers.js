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

// In bridgeless mode, timers are host functions installed from cpp.
if (!global.RN$Bridgeless) {
  const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');

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
