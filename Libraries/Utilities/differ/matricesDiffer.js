/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * Unrolls an array comparison specially for matrices. Prioritizes
 * checking of indices that are most likely to change so that the comparison
 * bails as early as possible.
 *
 * @param {MatrixMath.Matrix} one First matrix.
 * @param {MatrixMath.Matrix} two Second matrix.
 * @return {boolean} Whether or not the two matrices differ.
 */
const matricesDiffer = function(one, two) {
  if (one === two) {
    return false;
  }
  return (
    !one ||
    !two ||
    one[12] !== two[12] ||
    one[13] !== two[13] ||
    one[14] !== two[14] ||
    one[5] !== two[5] ||
    one[10] !== two[10] ||
    one[1] !== two[1] ||
    one[2] !== two[2] ||
    one[3] !== two[3] ||
    one[4] !== two[4] ||
    one[6] !== two[6] ||
    one[7] !== two[7] ||
    one[8] !== two[8] ||
    one[9] !== two[9] ||
    one[11] !== two[11] ||
    one[15] !== two[15]
  );
};

module.exports = matricesDiffer;
