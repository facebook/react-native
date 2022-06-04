/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

describe('groupByEveryN', () => {
  const groupByEveryN = require('../groupByEveryN');

  it('should group by with different n', () => {
    expect(groupByEveryN([1, 2, 3, 4, 5, 6, 7, 8, 9], 1)).toEqual([
      [1],
      [2],
      [3],
      [4],
      [5],
      [6],
      [7],
      [8],
      [9],
    ]);
    expect(groupByEveryN([1, 2, 3, 4, 5, 6, 7, 8, 9], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
      [9, null],
    ]);
    expect(groupByEveryN([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
    expect(groupByEveryN([1, 2, 3, 4, 5, 6, 7, 8, 9], 4)).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, null, null, null],
    ]);
  });

  it('should fill with null', () => {
    expect(groupByEveryN([], 4)).toEqual([]);
    expect(groupByEveryN([1], 4)).toEqual([[1, null, null, null]]);
    expect(groupByEveryN([1, 2], 4)).toEqual([[1, 2, null, null]]);
    expect(groupByEveryN([1, 2, 3], 4)).toEqual([[1, 2, 3, null]]);
    expect(groupByEveryN([1, 2, 3, 4], 4)).toEqual([[1, 2, 3, 4]]);
  });
});
