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
 * This exposes the native ToastAndroid module as a JS module. This has a function 'showText'
 * which takes the following parameters:
 *
 * 1. String message: A string with the text to toast
 * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG
 */

var ToastAndroid = {

  SHORT: RCTToastAndroid.SHORT,
  LONG: RCTToastAndroid.LONG,

  show: function (
    message: string,
    duration: number
  ): void {
    RCTToastAndroid.show(message, duration);
  },

};

module.exports = ToastAndroid;
