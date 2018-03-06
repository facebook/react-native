/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Vibration
 * @flow
 * @jsdoc
 */
'use strict';

var RCTVibration = require('NativeModules').Vibration;
var Platform = require('Platform');

/**
 * Vibration API
 *
 * See https://facebook.github.io/react-native/docs/vibration.html
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
  setTimeout(() => vibrateScheduler(id, pattern, repeat, nextIndex + 1), pattern[nextIndex]);
}

var Vibration = {
  /**
   * Trigger a vibration with specified `pattern`.
   *
   * See https://facebook.github.io/react-native/docs/vibration.html#vibrate
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
   *
   * See https://facebook.github.io/react-native/docs/vibration.html#cancel
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
