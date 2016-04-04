/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Vibration
 * @flow
 */
'use strict';

var RCTVibration = require('NativeModules').Vibration;
var Platform = require('Platform');

/**
 * The Vibration API is exposed at `Vibration.vibrate()`.
 * The vibration is asynchronous so this method will return immediately.
 *
 * There will be no effect on devices that do not support Vibration, eg. the simulator.
 *
 * Note for android
 * add `<uses-permission android:name="android.permission.VIBRATE"/>` to `AndroidManifest.xml`
 *
 * Vibration patterns are currently unsupported.
 */

var Vibration = {
  vibrate: function(pattern: number | Array<number> = 400, repeat: boolean = false) {
    if (Platform.OS === 'android') {
      if (typeof pattern === 'number') {
        RCTVibration.vibrate(pattern);
      } else if (Array.isArray(pattern)) {
        RCTVibration.vibrateByPattern(pattern, repeat ? 0 : -1);
      } else {
        throw new Error('Vibration pattern should be a number or array');
      }
    } else {
      if (typeof pattern === 'number') {
        RCTVibration.vibrate();
      } else if (Array.isArray(pattern)) {
        console.warn('Vibration patterns are not supported on iOS');
      } else {
        throw new Error('Vibration pattern should be a number or array');
      }
    }
  },
  /**
   * Stop vibration
   *
   * @platform android
   */
  cancel: function() {
    if (Platform.OS === 'ios') {
      console.warn('Vibration.cancel is not supported on iOS');
    } else {
      RCTVibration.cancel();
    }
  }
};

module.exports = Vibration;
