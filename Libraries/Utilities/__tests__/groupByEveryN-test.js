/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

describe('groupByEveryN', () => {
  var groupByEveryN = require('groupByEveryN');

  it('should group by with different n', () => {
    expect(groupByEveryN([1, 2, 3, 4, 5, 6, 7, 8, 9], 1))
      .toEqual([[1], [2], [3], [4], [5], [6], [7], [8], [9]]);
    expect(groupByEveryN([1, 2, 3, 4, 5, 6, 7, 8, 9], 2))
      .toEqual([[1, 2], [3, 4], [5, 6], [7, 8], [9, null]]);
    expect(groupByEveryN([1, 2, 3, 4, 5, 6, 7, 8, 9], 3))
      .toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    expect(groupByEveryN([1, 2, 3, 4, 5, 6, 7, 8, 9], 4))
      .toEqual([[1, 2, 3, 4], [5, 6, 7, 8], [9, null, null, null]]);
  });

  it('should fill with null', () => {
    expect(groupByEveryN([], 4))
      .toEqual([]);
    expect(groupByEveryN([1], 4))
      .toEqual([[1, null, null, null]]);
    expect(groupByEveryN([1, 2], 4))
      .toEqual([[1, 2, null, null]]);
    expect(groupByEveryN([1, 2, 3], 4))
      .toEqual([[1, 2, 3, null]]);
    expect(groupByEveryN([1, 2, 3, 4], 4))
      .toEqual([[1, 2, 3, 4]]);
  });
});
