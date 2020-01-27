/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 * @polyfill
 */

if (!global.performance) {
  global.performance = {};
}

/**
 * Returns a double, measured in milliseconds.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
 */
if (typeof global.performance !== 'function') {
  global.performance.now = function() {
    return global.nativePerformanceNow();
  };
}
