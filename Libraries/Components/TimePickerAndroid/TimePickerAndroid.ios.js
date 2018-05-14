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

const TimePickerAndroid = {
  async open(options: Object): Promise<Object> {
    return Promise.reject({
      message: 'TimePickerAndroid is not supported on this platform.',
    });
  },
};

module.exports = TimePickerAndroid;
