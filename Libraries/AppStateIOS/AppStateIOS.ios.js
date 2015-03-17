/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AppStateIOS
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTAppState = NativeModules.RCTAppState;

var logError = require('logError');

var DEVICE_APPSTATE_EVENT = 'appStateDidChange';

var _appStateHandlers = {};

class AppStateIOS {

  static addEventListener(type, handler) {
    _appStateHandlers[handler] = RCTDeviceEventEmitter.addListener(
      DEVICE_APPSTATE_EVENT,
      (appStateData) => {
        handler(appStateData.app_state);
      }
    );
  }

  static removeEventListener(type, handler) {
    if (!_appStateHandlers[handler]) {
      return;
    }
    _appStateHandlers[handler].remove();
    _appStateHandlers[handler] = null;
  }

}

AppStateIOS.currentState = null;

RCTDeviceEventEmitter.addListener(
  DEVICE_APPSTATE_EVENT,
  (appStateData) => {
    AppStateIOS.currentState = appStateData.app_state;
  }
);

RCTAppState.getCurrentAppState(
  (appStateData) => {
    AppStateIOS.currentState = appStateData.app_state;
  },
  logError
);

module.exports = AppStateIOS;
