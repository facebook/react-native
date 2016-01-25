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

var _backPressSubscriptions = new Set();

RCTDeviceEventEmitter.addListener(DEVICE_BACK_EVENT, function() {
  var invokeDefault = true;
  _backPressSubscriptions.forEach((subscription) => {
    if (subscription()) {
      invokeDefault = false;
    }
  });
  if (invokeDefault) {
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
    _backPressSubscriptions.add(handler);
  },

  removeEventListener: function(
    eventName: BackPressEventName,
    handler: Function
  ): void {
    _backPressSubscriptions.delete(handler);
  },

};

module.exports = BackAndroid;
