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

import type {SyntheticEvent} from 'CoreEventTypes';

type Options = {
  hour: number,
  minute: number,
  is24Hour: boolean,
  mode: 'clock' | 'spinner' | 'default',
};
type TimePickerAndroidEvent = SyntheticEvent<
  $ReadOnly<{|
    action: string,
    hour: number,
    minute: number,
  |}>,
>;

const TimePickerAndroid = {
  async open(options: Options): Promise<TimePickerAndroidEvent> {
    return Promise.reject({
      message: 'TimePickerAndroid is not supported on this platform.',
    });
  },
};

module.exports = TimePickerAndroid;
