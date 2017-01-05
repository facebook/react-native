/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ToastAndroid
 */

'use strict';

var RCTToastAndroid = require('NativeModules').ToastAndroid;

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
 * Basic usage:
 * ```javascript
 * ToastAndroid.show('A pikachu appeared nearby !', ToastAndroid.SHORT);
 * ToastAndroid.showWithGravity('All Your Base Are Belong To Us', ToastAndroid.SHORT, ToastAndroid.CENTER);
 * ```
 */

var ToastAndroid = {

  // Toast duration constants
  SHORT: RCTToastAndroid.SHORT,
  LONG: RCTToastAndroid.LONG,

  // Toast gravity constants
  TOP: RCTToastAndroid.TOP,
  BOTTOM: RCTToastAndroid.BOTTOM,
  CENTER: RCTToastAndroid.CENTER,

  show: function (
    message: string,
    duration: number
  ): void {
    RCTToastAndroid.show(message, duration);
  },

  showWithGravity: function (
    message: string,
    duration: number,
    gravity: number,
  ): void {
    RCTToastAndroid.showWithGravity(message, duration, gravity);
  },
};

module.exports = ToastAndroid;
