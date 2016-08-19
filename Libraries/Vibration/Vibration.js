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
 * **Note for android**
 * add `<uses-permission android:name="android.permission.VIBRATE"/>` to `AndroidManifest.xml`
 *
 * **Android Usage:**
 *
 * [0, 500, 200, 500]
 * V(0.5s) --wait(0.2s)--> V(0.5s)
 *
 * [300, 500, 200, 500]
 * --wait(0.3s)--> V(0.5s) --wait(0.2s)--> V(0.5s)
 *
 * **iOS Usage:**
 * if first argument is 0, it will not be included in pattern array.
 *
 * [0, 1000, 2000, 3000]
 * V(fixed) --wait(1s)--> V(fixed) --wait(2s)--> V(fixed) --wait(3s)--> V(fixed)
 *
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
        let initialVibrate = false;
        if (pattern[0] === 0) {
          if (pattern.length === 1) {
            RCTVibration.vibrate();
            return;
          }
          initialVibrate = true;
          pattern = pattern.slice(1);
        }
        RCTVibration.vibrateByPattern(pattern, repeat, initialVibrate);
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
    RCTVibration.cancel();
  }
};

module.exports = Vibration;
