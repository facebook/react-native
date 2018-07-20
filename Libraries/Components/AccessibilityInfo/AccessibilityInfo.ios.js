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
const Promise = require('Promise');
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

const AccessibilityManager = NativeModules.AccessibilityManager;

const VOICE_OVER_EVENT = 'voiceOverDidChange';
const ANNOUNCEMENT_DID_FINISH_EVENT = 'announcementDidFinish';

type ChangeEventName = $Enum<{
  change: string,
  announcementFinished: string,
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
  /**
   * Query whether a screen reader is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when a screen reader is enabledand `false` otherwise.
   *
   * See http://facebook.github.io/react-native/docs/accessibilityinfo.html#fetch
   */
  fetch: function(): Promise {
    return new Promise((resolve, reject) => {
      AccessibilityManager.getCurrentVoiceOverState(resolve, reject);
    });
  },

  /**
   * Add an event handler. Supported events:
   *
   * - `change`: Fires when the state of the screen reader changes. The argument
   *   to the event handler is a boolean. The boolean is `true` when a screen
   *   reader is enabled and `false` otherwise.
   * - `announcementFinished`: iOS-only event. Fires when the screen reader has
   *   finished making an announcement. The argument to the event handler is a
   *   dictionary with these keys:
   *     - `announcement`: The string announced by the screen reader.
   *     - `success`: A boolean indicating whether the announcement was
   *       successfully made.
   *
   * See http://facebook.github.io/react-native/docs/accessibilityinfo.html#addeventlistener
   */
  addEventListener: function(
    eventName: ChangeEventName,
    handler: Function,
  ): Object {
    let listener;

    if (eventName === 'change') {
      listener = RCTDeviceEventEmitter.addListener(VOICE_OVER_EVENT, handler);
    } else if (eventName === 'announcementFinished') {
      listener = RCTDeviceEventEmitter.addListener(
        ANNOUNCEMENT_DID_FINISH_EVENT,
        handler,
      );
    }

    _subscriptions.set(handler, listener);
    return {
      remove: AccessibilityInfo.removeEventListener.bind(
        null,
        eventName,
        handler,
      ),
    };
  },

  /**
   * Set accessibility focus to a react component.
   *
   * See http://facebook.github.io/react-native/docs/accessibilityinfo.html#setaccessibilityfocus
   */
  setAccessibilityFocus: function(reactTag: number): void {
    AccessibilityManager.setAccessibilityFocus(reactTag);
  },

  /**
   * Post a string to be announced by the screen reader.
   *
   * @platform ios
   *
   * See http://facebook.github.io/react-native/docs/accessibilityinfo.html#announceforaccessibility
   */
  announceForAccessibility: function(announcement: string): void {
    AccessibilityManager.announceForAccessibility(announcement);
  },

  /**
   * Remove an event handler.
   *
   * See http://facebook.github.io/react-native/docs/accessibilityinfo.html#removeeventlistener
   */
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
