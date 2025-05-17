/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

describe('DeviceInfo', () => {
  const DeviceInfo = require('../DeviceInfo').default;

  it('should give device info', () => {
    expect(DeviceInfo.getConstants()).toHaveProperty('Dimensions');
  });
});
