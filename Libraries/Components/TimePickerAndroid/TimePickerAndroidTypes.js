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

export type Options = {
  hour: number,
  minute: number,
  is24Hour: boolean,
  mode: 'clock' | 'spinner' | 'default',
};

export type TimePickerAndroidEvent = SyntheticEvent<
  $ReadOnly<{|
    action: string,
    hour: number,
    minute: number,
  |}>,
>;
