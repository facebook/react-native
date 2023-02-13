/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

if (!global.performance) {
  global.performance = ({}: {now?: () => number});
}

/**
 * Returns a double, measured in milliseconds.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
 */
if (typeof global.performance.now !== 'function') {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  global.performance.now = function () {
    const performanceNow = global.nativePerformanceNow || Date.now;
    return performanceNow();
  };
}
