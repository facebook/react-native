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
  global.performance = {
    now: function() {
      return global.nativePerformanceNow();
    },
  };
}
