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
  }
}

AppState.backgroundStatus = new Subscribable(
  RCTDeviceEventEmitter,
  'appStateDidChange',
  (resp) => resp.app_state,
  RKAppState.getCurrentAppState
);

AppState.BackgroundStatus = keyMirror({
  active: true,
  background: true,
  inactive: true,
});

// This check avoids redboxing if native RKReachability library isn't included in app
// TODO: Move reachability API into separate JS module to prevent need for this
if (RKReachability) {
  AppState.networkReachability = new Subscribable(
    RCTDeviceEventEmitter,
    'reachabilityDidChange',
    (resp) => resp.network_reachability,
    RKReachability.getCurrentReachability
  );
}

AppState.NetworkReachability = keyMirror({
  wifi: true,
  cell: true,
  none: true,
  unknown: true,
});

module.exports = AppState;
