/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule BackHandler
 */

'use strict';

var DeviceEventManager = require('NativeModules').DeviceEventManager;
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var DEVICE_BACK_EVENT = 'hardwareBackPress';

type BackPressEventName = $Enum<{
  backPress: string,
}>;

var _backPressSubscriptions = new Set();

RCTDeviceEventEmitter.addListener(DEVICE_BACK_EVENT, function() {
  var invokeDefault = true;
  var subscriptions = Array.from(_backPressSubscriptions.values()).reverse();

  for (var i = 0; i < subscriptions.length; ++i) {
    if (subscriptions[i]()) {
      invokeDefault = false;
      break;
    }
  }

  if (invokeDefault) {
    BackHandler.exitApp();
  }
});

/**
 * Detect hardware button presses for back navigation.
 *
 * Android: Detect hardware back button presses, and programmatically invoke the default back button
 * functionality to exit the app if there are no listeners or if none of the listeners return true.
 *
 * tvOS: Detect presses of the menu button on the TV remote.  (Still to be implemented:
 * programmatically disable menu button handling
 * functionality to exit the app if there are no listeners or if none of the listeners return true.)
 *
 * iOS: Not applicable.
 *
 * The event subscriptions are called in reverse order (i.e. last registered subscription first),
 * and if one subscription returns true then subscriptions registered earlier will not be called.
 *
 * Example:
 *
 * ```javascript
 * BackHandler.addEventListener('hardwareBackPress', function() {
 *  // this.onMainScreen and this.goBack are just examples, you need to use your own implementation here
 *  // Typically you would use the navigator here to go to the last state.
 *
 *  if (!this.onMainScreen()) {
 *    this.goBack();
 *    return true;
 *  }
 *  return false;
 * });
 * ```
 */
var BackHandler = {

  exitApp: function() {
    DeviceEventManager.invokeDefaultBackPressHandler();
  },

  /**
   * Adds an event handler. Supported events:
   *
   * - `hardwareBackPress`: Fires when the Android hardware back button is pressed or when the
   * tvOS menu button is pressed.
   */
  addEventListener: function (
    eventName: BackPressEventName,
    handler: Function
  ): {remove: () => void} {
    _backPressSubscriptions.add(handler);
    return {
      remove: () => BackHandler.removeEventListener(eventName, handler),
    };
  },

  /**
   * Removes the event handler.
   */
  removeEventListener: function(
    eventName: BackPressEventName,
    handler: Function
  ): void {
    _backPressSubscriptions.delete(handler);
  },

};

module.exports = BackHandler;
