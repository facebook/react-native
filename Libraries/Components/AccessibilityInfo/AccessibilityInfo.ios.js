/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type EventEmitter from '../../vendor/emitter/EventEmitter';
import RCTDeviceEventEmitter from '../../EventEmitter/RCTDeviceEventEmitter';
import NativeAccessibilityManager from './NativeAccessibilityManager';
import type {EventSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import {sendAccessibilityEvent} from '../../Renderer/shims/ReactNative';
import legacySendAccessibilityEvent from './legacySendAccessibilityEvent';
import {type ElementRef} from 'react';

const SupportedEvents: Set<string> = new Set([
  'announcementFinished',
  'boldTextChanged',
  'grayscaleChanged',
  'invertColorsChanged',
  'reduceMotionChanged',
  'reduceTransparencyChanged',
  'screenReaderChanged',
]);

type AccessibilityEventDefinitions = {
  boldTextChanged: [boolean],
  grayscaleChanged: [boolean],
  invertColorsChanged: [boolean],
  reduceMotionChanged: [boolean],
  reduceTransparencyChanged: [boolean],
  screenReaderChanged: [boolean],
  // alias for screenReaderChanged
  change: [boolean],
  announcementFinished: [
    {
      announcement: string,
      success: boolean,
    },
  ],
};

// 'click' event type is not implemented in iOS. It's declared here to avoid flow type errors
type AccessibilityEventTypes = 'focus' | 'click';

/**
 * Sometimes it's useful to know whether or not the device has a screen reader
 * that is currently active. The `AccessibilityInfo` API is designed for this
 * purpose. You can use it to query the current state of the screen reader as
 * well as to register to be notified when the state of the screen reader
 * changes.
 *
 * See https://reactnative.dev/docs/accessibilityinfo.html
 */
const AccessibilityInfo = {
  /**
   * Query whether bold text is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when bold text is enabled and `false` otherwise.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#isBoldTextEnabled
   */
  isBoldTextEnabled: function(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (NativeAccessibilityManager) {
        NativeAccessibilityManager.getCurrentBoldTextState(resolve, reject);
      } else {
        reject(reject);
      }
    });
  },

  /**
   * Query whether grayscale is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when grayscale is enabled and `false` otherwise.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#isGrayscaleEnabled
   */
  isGrayscaleEnabled: function(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (NativeAccessibilityManager) {
        NativeAccessibilityManager.getCurrentGrayscaleState(resolve, reject);
      } else {
        reject(reject);
      }
    });
  },

  /**
   * Query whether inverted colors are currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when invert color is enabled and `false` otherwise.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#isInvertColorsEnabled
   */
  isInvertColorsEnabled: function(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (NativeAccessibilityManager) {
        NativeAccessibilityManager.getCurrentInvertColorsState(resolve, reject);
      } else {
        reject(reject);
      }
    });
  },

  /**
   * Query whether reduced motion is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when a reduce motion is enabled and `false` otherwise.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#isReduceMotionEnabled
   */
  isReduceMotionEnabled: function(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (NativeAccessibilityManager) {
        NativeAccessibilityManager.getCurrentReduceMotionState(resolve, reject);
      } else {
        reject(reject);
      }
    });
  },

  /**
   * Query whether reduced transparency is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when a reduce transparency is enabled and `false` otherwise.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#isReduceTransparencyEnabled
   */
  isReduceTransparencyEnabled: function(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (NativeAccessibilityManager) {
        NativeAccessibilityManager.getCurrentReduceTransparencyState(
          resolve,
          reject,
        );
      } else {
        reject(reject);
      }
    });
  },

  /**
   * Query whether a screen reader is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when a screen reader is enabled and `false` otherwise.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#isScreenReaderEnabled
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
   * Add an event handler. Supported events:
   *
   * - `boldTextChanged`: iOS-only event. Fires when the state of the bold text toggle changes.
   *   The argument to the event handler is a boolean. The boolean is `true` when a bold text
   *   is enabled and `false` otherwise.
   * - `grayscaleChanged`: iOS-only event. Fires when the state of the gray scale toggle changes.
   *   The argument to the event handler is a boolean. The boolean is `true` when a gray scale
   *   is enabled and `false` otherwise.
   * - `invertColorsChanged`: iOS-only event. Fires when the state of the invert colors toggle
   *   changes. The argument to the event handler is a boolean. The boolean is `true` when a invert
   *   colors is enabled and `false` otherwise.
   * - `reduceMotionChanged`: Fires when the state of the reduce motion toggle changes.
   *   The argument to the event handler is a boolean. The boolean is `true` when a reduce
   *   motion is enabled (or when "Transition Animation Scale" in "Developer options" is
   *   "Animation off") and `false` otherwise.
   * - `reduceTransparencyChanged`: iOS-only event. Fires when the state of the reduce transparency
   *   toggle changes.  The argument to the event handler is a boolean. The boolean is `true`
   *   when a reduce transparency is enabled and `false` otherwise.
   * - `screenReaderChanged`: Fires when the state of the screen reader changes. The argument
   *   to the event handler is a boolean. The boolean is `true` when a screen
   *   reader is enabled and `false` otherwise.
   * - `announcementFinished`: iOS-only event. Fires when the screen reader has
   *   finished making an announcement. The argument to the event handler is a
   *   dictionary with these keys:
   *     - `announcement`: The string announced by the screen reader.
   *     - `success`: A boolean indicating whether the announcement was
   *       successfully made.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#addeventlistener
   */
  addEventListener: function<K: $Keys<AccessibilityEventDefinitions>>(
    eventName: K,
    handler: (...$ElementType<AccessibilityEventDefinitions, K>) => void,
  ): EventSubscription {
    if (eventName === 'change') {
      return RCTDeviceEventEmitter.addListener('screenReaderChanged', handler);
    }
    if (SupportedEvents.has(eventName)) {
      return RCTDeviceEventEmitter.addListener(eventName, handler);
    }
    return {
      remove(): void {
        // Do nothing.
      },
    };
  },

  /**
   * Set accessibility focus to a react component.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#setaccessibilityfocus
   */
  setAccessibilityFocus: function(reactTag: number): void {
    legacySendAccessibilityEvent(reactTag, 'focus');
  },

  /**
   * Send a named accessibility event to a HostComponent.
   */
  sendAccessibilityEvent_unstable: function(
    handle: ElementRef<HostComponent<mixed>>,
    eventType: AccessibilityEventTypes,
  ) {
    // route through React renderer to distinguish between Fabric and non-Fabric handles
    sendAccessibilityEvent(handle, eventType);
  },

  /**
   * Post a string to be announced by the screen reader.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#announceforaccessibility
   */
  announceForAccessibility: function(announcement: string): void {
    if (NativeAccessibilityManager) {
      NativeAccessibilityManager.announceForAccessibility(announcement);
    }
  },

  /**
   * @deprecated Use `remove` on the EventSubscription from `addEventListener`.
   */
  removeEventListener: function<K: $Keys<AccessibilityEventDefinitions>>(
    eventName: K,
    handler: (...$ElementType<AccessibilityEventDefinitions, K>) => void,
  ): void {
    // NOTE: This will report a deprecation notice via `console.error`.
    if (eventName === 'change') {
      // $FlowIgnore[incompatible-cast]
      (RCTDeviceEventEmitter: EventEmitter<$FlowFixMe>).removeListener(
        'screenReaderChanged',
        // $FlowFixMe[invalid-tuple-arity]
        handler,
      );
    } else if (SupportedEvents.has(eventName)) {
      // $FlowIgnore[incompatible-cast]
      (RCTDeviceEventEmitter: EventEmitter<$FlowFixMe>).removeListener(
        eventName,
        // $FlowFixMe[invalid-tuple-arity]
        handler,
      );
    }
  },
};

module.exports = AccessibilityInfo;
