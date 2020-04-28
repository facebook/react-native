/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// TODO(macOS ISS#2323203)

'use strict';

import NativeTimePickerAndroid, {
  type TimePickerOptions,
  type TimePickerResult,
} from './NativeTimePickerAndroid';

const TimePickerAndroid = {
  async open(options: TimePickerOptions): Promise<TimePickerResult> {
    return Promise.reject({
      message: 'TimePickerAndroid is not supported on this platform.',
    });
  },
};

module.exports = TimePickerAndroid;
