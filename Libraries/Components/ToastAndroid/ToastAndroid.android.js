/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ToastAndroid
 * @flow
 */

'use strict';

const RCTToastAndroid = require('NativeModules').ToastAndroid;

let lastToastId = 0;

/**
 * This exposes the native ToastAndroid module as a JS module. This has a function 'show'
 * which takes the following parameters:
 *
 * 1. String message: A string with the text to toast
 * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG
 *
 * Returns an object with a `dismiss` method to dismiss the Toast.
 */

const ToastAndroid = {

  SHORT: RCTToastAndroid.SHORT,
  LONG: RCTToastAndroid.LONG,

  show: function (
    message: string,
    duration: number
  ): { dismiss: Function } {
    lastToastId++;
    RCTToastAndroid.show(message, duration, lastToastId);
    return {
      dismiss: () => RCTToastAndroid.dismiss(lastToastId)
    };
  },

};

module.exports = ToastAndroid;
