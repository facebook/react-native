/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TimePickerAndroid
 * @flow
 */
'use strict';

const TimePickerAndroid = {
  async open(options: Object): Promise<Object> {
    return Promise.reject({
      message: 'TimePickerAndroid is not supported on this platform.'
    });
  },
};

module.exports = TimePickerAndroid;
