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

const warning = require('fbjs/lib/warning');

type ChangeEventName = $Keys<{}>;

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
   * Android and iOS only
   */
  isScreenReaderEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
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
  ): void {
    warning(false, 'AccessibilityInfo is not supported on this platform.');
  },

  removeEventListener: function(
    eventName: ChangeEventName,
    handler: Function,
  ): void {
    warning(false, 'AccessibilityInfo is not supported on this platform.');
  },

  /**
   * Set accessibility focus to a react component.
   *
   * See http://facebook.github.io/react-native/docs/accessibilityinfo.html#setaccessibilityfocus
   */
  setAccessibilityFocus: function(reactTag: number): void {
    warning(false, 'AccessibilityInfo is not supported on this platform.');
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
