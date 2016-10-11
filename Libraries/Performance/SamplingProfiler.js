/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SamplingProfiler
 * @flow
 */
'use strict';

var SamplingProfiler = {
  poke: function (token: number): void {
    var error = null;
    var result = null;
    try {
      result = global.pokeSamplingProfiler();
      if (result === null) {
        console.log('The JSC Sampling Profiler has started');
      } else {
        console.log('The JSC Sampling Profiler has stopped');
      }
    } catch (e) {
      console.log(
        'Error occured when restarting Sampling Profiler: ' + e.toString());
      error = e.toString();
    }
    require('NativeModules').JSCSamplingProfiler.operationComplete(
      token, result, error);
  },
};

module.exports = SamplingProfiler;
