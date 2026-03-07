/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import NativeVibration from './NativeVibration';

/**
 * Vibration API
 *
 * See https://reactnative.dev/docs/vibration
 */

const _default_vibration_length = 400;

const Vibration = {
  /**
   * Trigger a vibration with specified `pattern`.
   *
   * See https://reactnative.dev/docs/vibration#vibrate
   */
  vibrate: function (
    pattern?: number | Array<number> = _default_vibration_length,
    repeat?: boolean = false,
  ) {
    if (typeof pattern === 'number') {
      NativeVibration.vibrate(pattern);
    } else if (Array.isArray(pattern)) {
      NativeVibration.vibrateByPattern(pattern, repeat ? 0 : -1);
    } else {
      throw new Error('Vibration pattern should be a number or array');
    }
  },
  /**
   * Stop vibration
   *
   * See https://reactnative.dev/docs/vibration#cancel
   */
  cancel: function () {
    NativeVibration.cancel();
  },
};

export default Vibration;
