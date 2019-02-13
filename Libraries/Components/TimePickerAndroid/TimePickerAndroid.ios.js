/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {
  TimePickerOptions,
  TimePickerResult,
} from './TimePickerAndroidTypes';

const TimePickerAndroid = {
  async open(options: TimePickerOptions): Promise<TimePickerResult> {
    return Promise.reject({
      message: 'TimePickerAndroid is not supported on this platform.',
    });
  },
};

module.exports = TimePickerAndroid;
