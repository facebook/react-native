/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule groupByEveryN
 * @flow
 */

/**
 * Useful method to split an array into groups of the same number of elements.
 * You can use it to generate grids, rows, pages...
 *
 * If the input length is not a multiple of the count, it'll fill the last
 * array with null so you can display a placeholder.
 *
 * Example:
 *   groupByEveryN([1, 2, 3, 4, 5], 3)
 *    => [[1, 2, 3], [4, 5, null]]
 *
 *   groupByEveryN([1, 2, 3], 2).map(elems => {
 *     return <Row>{elems.map(elem => <Elem>{elem}</Elem>)}</Row>;
 *   })
 */
'use strict';

function groupByEveryN<T>(array: Array<T>, n: number): Array<Array<?T>> {
  var result = [];
  var temp = [];

  for (var i = 0; i < array.length; ++i) {
    if (i > 0 && i % n === 0) {
      result.push(temp);
      temp = [];
    }
    temp.push(array[i]);
  }

  if (temp.length > 0) {
    while (temp.length !== n) {
      temp.push(null);
    }
    result.push(temp);
  }

  return result;
}

module.exports = groupByEveryN;
