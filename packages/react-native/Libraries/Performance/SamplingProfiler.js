/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const SamplingProfiler = {
  poke: function(token: number): void {
    let error = null;
    let result = null;
    try {
      result = global.pokeSamplingProfiler();
      if (result === null) {
        console.log('The JSC Sampling Profiler has started');
      } else {
        console.log('The JSC Sampling Profiler has stopped');
      }
    } catch (e) {
      console.log(
        'Error occurred when restarting Sampling Profiler: ' + e.toString(),
      );
      error = e.toString();
    }

    const NativeJSCSamplingProfiler = require('./NativeJSCSamplingProfiler')
      .default;
    if (NativeJSCSamplingProfiler) {
      NativeJSCSamplingProfiler.operationComplete(token, result, error);
    }
  },
};

module.exports = SamplingProfiler;
