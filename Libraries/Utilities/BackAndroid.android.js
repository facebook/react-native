/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BackAndroid
 */

'use strict';

var DeviceEventManager = require('NativeModules').DeviceEventManager;
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var DEVICE_BACK_EVENT = 'hardwareBackPress';

type BackPressEventName = $Enum<{
  backPress: string;
}>;

var _backPressSubscriptions = [];

RCTDeviceEventEmitter.addListener(DEVICE_BACK_EVENT, function() {
  var propagate = true;
  for (var i = _backPressSubscriptions.length - 1; i >= 0; i--) {
    var subscription = _backPressSubscriptions[i];
    if (subscription()) {
      propagate = false;
      break;
    }
  }

  if (propagate) {
    BackAndroid.exitApp();
  }
});

/**
 * Detect hardware back button presses, and programmatically invoke the default back button
 * functionality to exit the app if there are no listeners or if none of the listeners return true.
 *
 * Example:
 *
 * ```js
 * BackAndroid.addEventListener('hardwareBackPress', function() {
 * 	 if (!this.onMainScreen()) {
 * 	   this.goBack();
 * 	   return true;
 * 	 }
 * 	 return false;
 * });
 * ```
 */
var BackAndroid = {

  exitApp: function() {
    DeviceEventManager.invokeDefaultBackPressHandler();
  },

  addEventListener: function (
    eventName: BackPressEventName,
    handler: Function
  ): void {
    _backPressSubscriptions.push(handler);
  },

  removeEventListener: function(
    eventName: BackPressEventName,
    handler: Function
  ): void {
    var index = _backPressSubscriptions.indexOf(handler);
    if (index !== -1) {
      _backPressSubscriptions.splice(index, 1);
    }
  },

};

module.exports = BackAndroid;
