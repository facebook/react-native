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

type Options = $ReadOnly<{|
  date?: ?(Date | number),
  minDate?: ?(Date | number),
  maxDate?: ?(Date | number),
  mode?: ?('calender' | 'spinner' | 'default'),
|}>;

const DatePickerAndroid = {
  async open(options: Options): Promise<void> {
    return Promise.reject({
      message: 'DatePickerAndroid is not supported on this platform.',
    });
  },
};

module.exports = DatePickerAndroid;
