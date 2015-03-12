/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AdSupportIOS
 */
'use strict';

var AdSupport = require('NativeModules').RCTAdSupport;

module.exports = {
  getAdvertisingId: function(onSuccess, onFailure) {
    AdSupport.getAdvertisingId(onSuccess, onFailure);
  },

  getAdvertisingTrackingEnabled: function(onSuccess, onFailure) {
    AdSupport.getAdvertisingTrackingEnabled(onSuccess, onFailure);
  },
};
