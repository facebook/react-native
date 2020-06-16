/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

// TODO(macOS ISS#2323203)

'use strict';

const Promise = require('../../Promise');
const RCTDeviceEventEmitter = require('../../EventEmitter/RCTDeviceEventEmitter');

import NativeAccessibilityManager from './NativeAccessibilityManager';

const warning = require('fbjs/lib/warning');

const CHANGE_EVENT_NAME = {
  screenReaderChanged: 'screenReaderChanged',
};

type ChangeEventName = $Keys<{
  change: string,
  screenReaderChanged: string,
}>;

const _subscriptions = new Map();
const AccessibilityInfo = {
  /**
   * iOS only
   */
  isBoldTextEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
  },

  /**
   * iOS only
   */
  isGrayscaleEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
  },

  /**
   * iOS only
   */
  isInvertColorsEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
  },

  /**
   * Android and iOS only
   */
  isReduceMotionEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
  },

  /**
   * iOS only
   */
  isReduceTransparencyEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
  },

  /**
   * Query whether a screen reader is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when a screen reader is enabled and `false` otherwise.
   *
   * See http://facebook.github.io/react-native/docs/accessibilityinfo.html#isScreenReaderEnabled
   */
  isScreenReaderEnabled: function(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (NativeAccessibilityManager) {
        NativeAccessibilityManager.getCurrentVoiceOverState(resolve, reject);
      } else {
        reject(reject);
      }
    });
  },

  /**
   * Deprecated
   *
   * Same as `isScreenReaderEnabled`
   */
  get fetch() {
    return this.isScreenReaderEnabled;
  },

  addEventListener: function(
    eventName: ChangeEventName,
    handler: Function,
  ): Object {
    let listener;

    if (eventName === 'change') {
      listener = RCTDeviceEventEmitter.addListener(
        CHANGE_EVENT_NAME.screenReaderChanged,
        handler,
      );
    } else if (CHANGE_EVENT_NAME[eventName]) {
      listener = RCTDeviceEventEmitter.addListener(eventName, handler);
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

  /**
   * Set accessibility focus to a react component.
   *
   * See http://facebook.github.io/react-native/docs/accessibilityinfo.html#setaccessibilityfocus
   */
  setAccessibilityFocus: function(reactTag: number): void {
    if (NativeAccessibilityManager) {
      NativeAccessibilityManager.setAccessibilityFocus(reactTag);
    }
  },

  /**
   * Post a string to be announced by the screen reader.
   *
   * See http://facebook.github.io/react-native/docs/accessibilityinfo.html#announceforaccessibility
   */
  announceForAccessibility: function(announcement: string): void {
    warning(false, 'AccessibilityInfo is not supported on this platform.');
  },
};

module.exports = AccessibilityInfo;
