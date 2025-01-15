/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import Performance from '../../src/private/webapis/performance/Performance';
import NativePerformance from '../../src/private/webapis/performance/specs/NativePerformance';

// In case if the native implementation of the Performance API is available, use it,
// otherwise fall back to the legacy/default one, which only defines 'Performance.now()'
if (NativePerformance) {
  // $FlowExpectedError[cannot-write]
  global.performance = new Performance();
} else {
  if (!global.performance) {
    // $FlowExpectedError[cannot-write]
    global.performance = {
      mark: () => {},
      measure: () => {},
      now: () => {
        const performanceNow = global.nativePerformanceNow || Date.now;
        return performanceNow();
      },
    };
  }
}
