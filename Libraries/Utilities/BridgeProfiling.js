/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BridgeProfiling
 * @flow
 */
'use strict';

var GLOBAL = GLOBAL || this;
var TRACE_TAG_REACT_APPS = 1 << 17;

var BridgeProfiling = {
  profile(profileName?: any) {
    if (GLOBAL.__BridgeProfilingIsProfiling) {
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      console.profile(TRACE_TAG_REACT_APPS, profileName);
    }
  },

  profileEnd() {
    if (GLOBAL.__BridgeProfilingIsProfiling) {
      console.profileEnd(TRACE_TAG_REACT_APPS);
    }
  },

  swizzleReactPerf() {
    var ReactPerf = require('ReactPerf');
    var originalMeasure = ReactPerf.measure;
    ReactPerf.measure = function (objName, fnName, func) {
      func = originalMeasure.apply(ReactPerf, arguments);
      return function (component) {
        if (GLOBAL.__BridgeProfilingIsProfiling) {
          var name = this._instance && this._instance.constructor &&
            (this._instance.constructor.displayName ||
             this._instance.constructor.name);
          BridgeProfiling.profile(`${objName}.${fnName}(${name})`);
        }
        var ret = func.apply(this, arguments);
        BridgeProfiling.profileEnd();
        return ret;
      };
    };
  },
};

module.exports = BridgeProfiling;
