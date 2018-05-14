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

const RCTVibration = require('NativeModules').Vibration;

const invariant = require('fbjs/lib/invariant');

/**
 * NOTE: `VibrationIOS` is being deprecated. Use `Vibration` instead.
 *
 * The Vibration API is exposed at `VibrationIOS.vibrate()`. On iOS, calling this
 * function will trigger a one second vibration. The vibration is asynchronous
 * so this method will return immediately.
 *
 * There will be no effect on devices that do not support Vibration, eg. the iOS
 * simulator.
 *
 * Vibration patterns are currently unsupported.
 */

const VibrationIOS = {
  /**
   * @deprecated
   */
  vibrate: function() {
    invariant(arguments[0] === undefined, 'Vibration patterns not supported.');
    RCTVibration.vibrate();
  },
};

module.exports = VibrationIOS;
