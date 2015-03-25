/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AppStateIOS
 * @flow
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTAppState = NativeModules.AppState;

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
