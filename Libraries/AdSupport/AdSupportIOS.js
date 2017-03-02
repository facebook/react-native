/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AdSupportIOS
 * @flow
 */
'use strict';

/**
 * `AdSupport` provides access to the advertisingidentifier. It's not currently linked 
 * because it triggers an automatic detection from Apple on submission to the App Store 
 * to justify its use. 
 * 
 * Before using this you must link the `RCTAdSupport` library. In 
 * Xcode, you can manually add the RCTAdSupport.m and RCTAdSupport.h files from
 * node_modules/react-native/Libraries/AdSupport/ to the Libraries/React/Base/ folder of 
 * your current project.
 * You can refer to [Linking](docs/linking-libraries-ios.html) for help.
 *
 *
 */

var AdSupport = require('NativeModules').AdSupport;

module.exports = {
  getAdvertisingId: function(onSuccess: Function, onFailure: Function) {
    AdSupport.getAdvertisingId(onSuccess, onFailure);
  },

  getAdvertisingTrackingEnabled: function(onSuccess: Function, onFailure: Function) {
    AdSupport.getAdvertisingTrackingEnabled(onSuccess, onFailure);
  },
};
