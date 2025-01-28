/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

describe('DeviceInfo', () => {
  const DeviceInfo = require('../DeviceInfo');

  it('should give device info', () => {
    expect(DeviceInfo.getConstants()).toHaveProperty('Dimensions');
  });
});
