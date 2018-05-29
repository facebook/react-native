/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const NativeModules = require('NativeModules');
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

const RCTAccessibilityInfo = NativeModules.AccessibilityInfo;

const TOUCH_EXPLORATION_EVENT = 'touchExplorationDidChange';

type ChangeEventName = $Enum<{
  change: string,
}>;

const _subscriptions = new Map();

/**
 * Sometimes it's useful to know whether or not the device has a screen reader
 * that is currently active. The `AccessibilityInfo` API is designed for this
 * purpose. You can use it to query the current state of the screen reader as
 * well as to register to be notified when the state of the screen reader
 * changes.
 *
 * See http://facebook.github.io/react-native/docs/accessibilityinfo.html
 */

const AccessibilityInfo = {
  fetch: function(): Promise {
    return new Promise((resolve, reject) => {
      RCTAccessibilityInfo.isTouchExplorationEnabled(function(resp) {
        resolve(resp);
      });
    });
  },

  addEventListener: function(
    eventName: ChangeEventName,
    handler: Function,
  ): void {
    const listener = RCTDeviceEventEmitter.addListener(
      TOUCH_EXPLORATION_EVENT,
      enabled => {
        handler(enabled);
      },
    );
    _subscriptions.set(handler, listener);
  },

  removeEventListener: function(
    eventName: ChangeEventName,
    handler: Function,
  ): void {
    const listener = _subscriptions.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _subscriptions.delete(handler);
  },
};

module.exports = AccessibilityInfo;
