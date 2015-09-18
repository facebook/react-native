/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule VibrationAndroid
 */

'use strict';

var RCTVibrationAndroid = require('NativeModules').VibrationAndroid;

/**
 * This exposes the native VibrationAndroid module as a JS module. This has a function 'vibrate'
 * which takes the following parameters:
 *
 * 1. int duration: The duration of the vibration in milliseconds.
 */

var VibrationAndroid = {

  vibrate: function (
    duration: number
  ): void {
    RCTVibrationAndroid.vibrate(duration);
  },

};

module.exports = VibrationAndroid;
