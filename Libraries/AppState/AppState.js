/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AppState
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTAppState = NativeModules.RCTAppState;

var AppState = {

  setApplicationIconBadgeNumber: function(number) {
    RCTAppState.setApplicationIconBadgeNumber(number);
  },

  getApplicationIconBadgeNumber: function(callback) {
    RCTAppState.getApplicationIconBadgeNumber(callback);
  },

};

module.exports = AppState;
