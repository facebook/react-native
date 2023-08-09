/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import NativePerformance from '../WebPerformance/NativePerformance';
import Performance from '../WebPerformance/Performance';

// In case if the native implementation of the Performance API is available, use it,
// otherwise fall back to the legacy/default one, which only defines 'Performance.now()'
if (NativePerformance) {
  // $FlowExpectedError[cannot-write]
  global.performance = new Performance();
} else {
  if (!global.performance) {
    // $FlowExpectedError[cannot-write]
    global.performance = ({}: {now?: () => number});
  }

  /**
   * Returns a double, measured in milliseconds.
   * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
   */
  if (typeof global.performance.now !== 'function') {
    // $FlowExpectedError[cannot-write]
    global.performance.now = function () {
      const performanceNow = global.nativePerformanceNow || Date.now;
      return performanceNow();
    };
  }
}
