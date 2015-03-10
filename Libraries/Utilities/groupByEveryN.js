/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule groupByEveryN
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

function groupByEveryN(array, n) {
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
