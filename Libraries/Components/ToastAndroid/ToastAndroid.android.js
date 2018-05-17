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

const RCTToastAndroid = require('NativeModules').ToastAndroid;

/**
 * This exposes the native ToastAndroid module as a JS module. This has a function 'show'
 * which takes the following parameters:
 *
 * 1. String message: A string with the text to toast
 * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG
 *
 * There is also a function `showWithGravity` to specify the layout gravity. May be
 * ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER.
 *
 * The 'showWithGravityAndOffset' function adds on the ability to specify offset
 * These offset values will translate to pixels.
 *
 * Basic usage:
 * ```javascript
 * ToastAndroid.show('A pikachu appeared nearby !', ToastAndroid.SHORT);
 * ToastAndroid.showWithGravity('All Your Base Are Belong To Us', ToastAndroid.SHORT, ToastAndroid.CENTER);
 * ToastAndroid.showWithGravityAndOffset('A wild toast appeared!', ToastAndroid.LONG, ToastAndroid.BOTTOM, 25, 50);
 * ```
 */

const ToastAndroid = {
  // Toast duration constants
  SHORT: RCTToastAndroid.SHORT,
  LONG: RCTToastAndroid.LONG,

  // Toast gravity constants
  TOP: RCTToastAndroid.TOP,
  BOTTOM: RCTToastAndroid.BOTTOM,
  CENTER: RCTToastAndroid.CENTER,

  show: function(message: string, duration: number): void {
    RCTToastAndroid.show(message, duration);
  },

  showWithGravity: function(
    message: string,
    duration: number,
    gravity: number,
  ): void {
    RCTToastAndroid.showWithGravity(message, duration, gravity);
  },

  showWithGravityAndOffset: function(
    message: string,
    duration: number,
    gravity: number,
    xOffset: number,
    yOffset: number,
  ): void {
    RCTToastAndroid.showWithGravityAndOffset(
      message,
      duration,
      gravity,
      xOffset,
      yOffset,
    );
  },
};

module.exports = ToastAndroid;
