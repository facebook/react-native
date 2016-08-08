/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

function permutations(options, cutOff = 0) {
  const results = [];
  function permute(arr, memory) {
    const memo = memory || [];
    let cur;
    for (let i = 0; i < arr.length; ++i) {
      cur = arr.splice(i, 1);
      if (arr.length === cutOff) {
        results.push(memo.concat(cur));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }
    return results;
  }
  return permute(options);
}

function reduce(array) {
  let result = [];
  for (let i = 0; i < array.length; ++i) {
    const permutation = permutations(array, i);
    result = result.concat(permutation);
  }
  return result;
}



module.exports = reduce;
