/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CPUProfiler
 * @flow
 */
'use strict';

var _label;
var _nestingLevel = 0;

var CPUProfiler = {

  start(profileName: string) {
    if (_nestingLevel === 0) {
      if (global.nativeProfilerStart) {
        _label = profileName;
        global.nativeProfilerStart(profileName);
      } else if (console.profile) {
        console.profile(profileName);
      }
    }
    _nestingLevel++;
  },
  end() {
    _nestingLevel--;
    if (_nestingLevel === 0) {
      if (global.nativeProfilerEnd) {
        global.nativeProfilerEnd(_label);
      } else if (console.profileEnd) {
        console.profileEnd();
      }
      _label = undefined;
    }
  }
};

module.exports = CPUProfiler;
