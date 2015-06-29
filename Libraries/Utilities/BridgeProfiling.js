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

var BridgeProfiling = {
  profile(profileName?: any, args?: any) {
    if (GLOBAL.__BridgeProfilingIsProfiling) {
      if (args) {
        try {
          args = JSON.stringify(args);
        } catch(err) {
          args = err.message;
        }
      }
      profileName = typeof profileName === 'function' ?
        profileName() : profileName;
      console.profile(profileName, args);
    }
  },

  profileEnd(profileName?: string) {
    if (GLOBAL.__BridgeProfilingIsProfiling) {
      console.profileEnd(profileName);
    }
  },

  swizzleReactPerf() {
    var ReactPerf = require('ReactPerf');
    var originalMeasure = ReactPerf.measure;
    ReactPerf.measure = function (objName, fnName, func) {
      func = originalMeasure.call(ReactPerf, objName, fnName, func);
      return function (component) {
        BridgeProfiling.profile();
        var ret = func.apply(this, arguments);
        if (GLOBAL.__BridgeProfilingIsProfiling) {
          var name = this._instance && this._instance.constructor &&
            (this._instance.constructor.displayName ||
             this._instance.constructor.name);
          BridgeProfiling.profileEnd(`${objName}.${fnName}(${name})`);
        }
        return ret;
      };
    };
  },
};

module.exports = BridgeProfiling;
