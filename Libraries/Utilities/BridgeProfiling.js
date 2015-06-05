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
  profile(profileName: String, args?: any) {
    if (GLOBAL.__BridgeProfilingIsProfiling) {
      if (args) {
        try {
          args = JSON.stringify(args);
        } catch(err) {
          args = err.message;
        }
      }
      console.profile(profileName, args);
    }
  },

  profileEnd() {
    if (GLOBAL.__BridgeProfilingIsProfiling) {
      console.profileEnd();
    }
  },
};

module.exports = BridgeProfiling;
