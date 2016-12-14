/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule HapticFeedbackIOS
 * @flow
 * @jsdoc
 */
'use strict';

var RCTHapticFeedback = require('NativeModules').HapticFeedback;

/**
 * @description `HapticFeedbackIOS` uses the Taptic Engine on iOS Devices. Available on iOS 10 and up.
 * Example of how-to-use:
 * ```
 * HapticFeedbackIOS.prepare()
 * HapticFeedbackIOS.generate('impact')
 * ```
 */

class HapticFeedbackIOS {
  /**
   * @static
   * @method prepare
   * @description Prepares the Taptic Engine (Awaken state). Usually used seconds before triggering a feedback.
   * This is optional, mostly used when the feedback needs to be synced with sound.
   *
   */
  static prepare() {
    RCTHapticFeedback.prepare();
  }

  /**
   * @static
   * @method Generate
   * @description Triggers haptic feedback of type :type
   * @param type Type of haptic feedback
   */
  static generate(type: 'impact' | 'notification' | 'selection') {
    RCTHapticFeedback.generate(type);
  }
}

module.exports = HapticFeedbackIOS;
