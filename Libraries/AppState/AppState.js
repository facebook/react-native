/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AppState
 */
'use strict';

var NativeModules = require('NativeModulesDeprecated');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RKAppState = NativeModules.RKAppState;
var RKReachability = NativeModules.RKReachability;
var Subscribable = require('Subscribable');

var keyMirror = require('keyMirror');

var AppState = {

  setApplicationIconBadgeNumber: function(number) {
    RKAppState.setApplicationIconBadgeNumber(number);
  },

  getApplicationIconBadgeNumber: function(callback) {
    RKAppState.getApplicationIconBadgeNumber(callback);
  },

};

module.exports = AppState;
