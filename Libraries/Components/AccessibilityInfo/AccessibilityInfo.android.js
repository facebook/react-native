/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AccessibilityInfo
 * @flow
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var RCTAccessibilityInfo = NativeModules.AccessibilityInfo;

var TOUCH_EXPLORATION_EVENT = 'touchExplorationDidChange';

type ChangeEventName = $Enum<{
  change: string,
}>;

var _subscriptions = new Map();

/**
 * Sometimes it's useful to know whether or not the device has a screen reader
 * that is currently active. The `AccessibilityInfo` API is designed for this
 * purpose. You can use it to query the current state of the screen reader as 
 * well as to register to be notified when the state of the screen reader 
 * changes.
 *
 * See http://facebook.github.io/react-native/docs/accessibilityinfo.html
 */

var AccessibilityInfo = {

  fetch: function(): Promise {
    return new Promise((resolve, reject) => {
      RCTAccessibilityInfo.isTouchExplorationEnabled(
        function(resp) {
          resolve(resp);
        }
      );
    });
  },

  addEventListener: function (
    eventName: ChangeEventName,
    handler: Function
  ): void {
    var listener = RCTDeviceEventEmitter.addListener(
      TOUCH_EXPLORATION_EVENT,
      (enabled) => {
        handler(enabled);
      }
    );
    _subscriptions.set(handler, listener);
  },

  removeEventListener: function(
    eventName: ChangeEventName,
    handler: Function
  ): void {
    var listener = _subscriptions.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _subscriptions.delete(handler);
  },

};

module.exports = AccessibilityInfo;
