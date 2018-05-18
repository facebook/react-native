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

const TimePickerModule = require('NativeModules').TimePickerAndroid;

/**
 * Opens the standard Android time picker dialog.
 *
 * ### Example
 *
 * ```
 * try {
 *   const {action, hour, minute} = await TimePickerAndroid.open({
 *     hour: 14,
 *     minute: 0,
 *     is24Hour: false, // Will display '2 PM'
 *   });
 *   if (action !== TimePickerAndroid.dismissedAction) {
 *     // Selected hour (0-23), minute (0-59)
 *   }
 * } catch ({code, message}) {
 *   console.warn('Cannot open time picker', message);
 * }
 * ```
 */
class TimePickerAndroid {
  /**
   * Opens the standard Android time picker dialog.
   *
   * The available keys for the `options` object are:
   *   * `hour` (0-23) - the hour to show, defaults to the current time
   *   * `minute` (0-59) - the minute to show, defaults to the current time
   *   * `is24Hour` (boolean) - If `true`, the picker uses the 24-hour format. If `false`,
   *     the picker shows an AM/PM chooser. If undefined, the default for the current locale
   *     is used.
   *   * `mode` (`enum('clock', 'spinner', 'default')`) - set the time picker mode
   *     - 'clock': Show a time picker in clock mode.
   *     - 'spinner': Show a time picker in spinner mode.
   *     - 'default': Show a default time picker based on Android versions.
   *
   * Returns a Promise which will be invoked an object containing `action`, `hour` (0-23),
   * `minute` (0-59) if the user picked a time. If the user dismissed the dialog, the Promise will
   * still be resolved with action being `TimePickerAndroid.dismissedAction` and all the other keys
   * being undefined. **Always** check whether the `action` before reading the values.
   */
  static async open(options: Object): Promise<Object> {
    return TimePickerModule.open(options);
  }

  /**
   * A time has been selected.
   */
  static get timeSetAction() {
    return 'timeSetAction';
  }
  /**
   * The dialog has been dismissed.
   */
  static get dismissedAction() {
    return 'dismissedAction';
  }
}

module.exports = TimePickerAndroid;
