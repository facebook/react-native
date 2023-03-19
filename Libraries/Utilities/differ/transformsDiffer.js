/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

const transformsDiffer = function(one, two) {
  if (one === two) {
    return false;
  }
  return (
    !one ||
    !two ||
    one.length !== two.length ||
    // Transform arrays are non-commutative (eg: "translate" operations 
    // affect "scale" operations). Using JSON.stringify is the lightest 
    // way to check both order and values, and it's pretty fast.
    JSON.stringify(one) !== JSON.stringify(two)
  );
};

module.exports = transformsDiffer;
