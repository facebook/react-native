/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule VibrationIOS
 */
'use strict';

var {RCTVibration} = require('NativeModules');
var invariant = require('invariant');

/**
 * The Vibration API is exposed at `VibrationIOS.vibrate()`. On iOS, calling this
 * function will trigger a one second vibration. The vibration is asynchronous
 * so this method will return immediately.
 *
 * There will be no effect on devices that do not support Vibration, eg. the iOS
 * simulator.
 *
 * Vibration patterns are currently unsupported.
 */

var VibrationIOS = {
  vibrate: function() {
    invariant(
      arguments[0] === undefined,
      'Vibration patterns not supported.'
    );
    RCTVibration.vibrate();
  }
};

module.exports = VibrationIOS;
