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

describe('clamp', () => {
  const clamp = require('../clamp');

  it('should return the value if the value does not exceed boundaries', () => {
    expect(clamp(0, 5, 10)).toEqual(5);
    expect(clamp(5, 5, 10)).toEqual(5);
    expect(clamp(0, 5, 5)).toEqual(5);
    expect(clamp(5, 5, 5)).toEqual(5);
  });

  it('should return the min value if the value is too low', () => {
    expect(clamp(10, 5, 20)).toEqual(10);
    expect(clamp(10, 9, 20)).toEqual(10);
  });

  it('should return the max value if the value is too high', () => {
    expect(clamp(10, 25, 20)).toEqual(20);
    expect(clamp(10, 21, 20)).toEqual(20);
  });
});
