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

if (!global.performance) {
  global.performance = ({...null}: {now?: () => number});
}

/**
 * Returns a double, measured in milliseconds.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
 */
if (typeof global.performance.now !== 'function') {
  global.performance.now = function () {
    const performanceNow = global.nativePerformanceNow || Date.now;
    return performanceNow();
  };
}
