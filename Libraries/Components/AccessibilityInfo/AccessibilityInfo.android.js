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

var NativeModules = require('../../BatchedBridge/NativeModules');
var RCTDeviceEventEmitter = require('../../EventEmitter/RCTDeviceEventEmitter');

var RCTAccessibilityInfo = NativeModules.AccessibilityInfo;

var TOUCH_EXPLORATION_EVENT = 'touchExplorationDidChange';

type ChangeEventName = $Enum<{
  change: string,
}>;

var _subscriptions = new Map();

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
