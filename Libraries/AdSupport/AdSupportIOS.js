/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AdSupportIOS
 */
'use strict';

var AdSupport = require('NativeModules').AdSupport;

module.exports = {
  getAdvertisingId: function(onSuccess, onFailure) {
    AdSupport.getAdvertisingId(onSuccess, onFailure);
  },

  getAdvertisingTrackingEnabled: function(onSuccess, onFailure) {
    AdSupport.getAdvertisingTrackingEnabled(onSuccess, onFailure);
  },
};
