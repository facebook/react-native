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
 * @jsdoc
 */
'use strict';

var RCTVibration = require('NativeModules').Vibration;
var Platform = require('Platform');

/**
 * @class
 * @description
 * The Vibration API is exposed at `Vibration.vibrate()`.
 * The vibration is asynchronous so this method will return immediately.
 *
 * There will be no effect on devices that do not support Vibration, eg. the simulator.
 *
 * **Note for Android:**
 * add `<uses-permission android:name="android.permission.VIBRATE"/>` to `AndroidManifest.xml`
 *
 * Since the **vibration duration in iOS is not configurable**, so there are some differences with Android.
 * In Android, if `pattern` is a number, it specified the vibration duration in ms. If `pattern`
 * is an array, those odd indices is the vibration duration, while the even one are the separation time.
 *
 * In iOS, invoking `vibrate(duration)` will just ignore the duration and vibrate for a fixed time. While the
 * `pattern` array is used to define the duration between each vibration. See below example for more.
 *
 * Repeatable vibration is also supported, the vibration will repeat with defined pattern until `cancel()` is called.
 *
 * Example:
 * ```
 * const DURATION = 10000
 * const PATTERN = [1000, 2000, 3000]
 *
 * Vibration.vibrate(DURATION)
 * // Android: vibrate for 10s
 * // iOS: duration is not configurable, vibrate for fixed time (about 500ms)
 *
 * Vibration.vibrate(PATTERN)
 * // Android: wait 1s -> vibrate 2s -> wait 3s
 * // iOS: wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate
 *
 * Vibration.vibrate(PATTERN, true)
 * // Android: wait 1s -> vibrate 2s -> wait 3s -> wait 1s -> vibrate 2s -> wait 3s -> ...
 * // iOS: wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate -> wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate -> ...
 *
 * Vibration.cancel()
 * // Android: vibration stopped
 * // iOS: vibration stopped
 * ```
 */

var _vibrating: boolean = false;
var _id: number = 0; // _id is necessary to prevent race condition.

function vibrateByPattern(pattern: Array<number>, repeat: boolean = false) {
  if (_vibrating) {
    return;
  }
  _vibrating = true;
  if (pattern[0] === 0) {
    RCTVibration.vibrate();
    pattern = pattern.slice(1);
  }
  if (pattern.length === 0) {
    _vibrating = false;
    return;
  }
  setTimeout(() => vibrateScheduler(++_id, pattern, repeat, 1), pattern[0]);
}

function vibrateScheduler(id, pattern: Array<number>, repeat: boolean, nextIndex: number) {
  if (!_vibrating || id !== _id) {
    return;
  }
  RCTVibration.vibrate();
  if (nextIndex >= pattern.length) {
    if (repeat) {
      nextIndex = 0;
    } else {
      _vibrating = false;
      return;
    }
  }
  setTimeout(() => vibrateScheduler(id, pattern, repeat, nextIndex+1), pattern[nextIndex]);
}

var Vibration = {
  /**
   * Trigger a vibration with specified `pattern`.
   * @param pattern Vibration pattern, accept a number or an array of number. Default to 400ms.
   * @param repeat Optional. Repeat vibration pattern until cancel(), default to false.
   */
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
      if (_vibrating) {
        return;
      }
      if (typeof pattern === 'number') {
        RCTVibration.vibrate();
      } else if (Array.isArray(pattern)) {
        vibrateByPattern(pattern, repeat);
      } else {
        throw new Error('Vibration pattern should be a number or array');
      }
    }
  },
  /**
   * Stop vibration
   * ```
   * Vibration.cancel()
   * ```
   */
  cancel: function() {
    if (Platform.OS === 'ios') {
      _vibrating = false;
    } else {
      RCTVibration.cancel();
    }
  }
};

module.exports = Vibration;
