/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule pointsDiffer
 */
'use strict';

var dummyPoint = {x: undefined, y: undefined};

var pointsDiffer = function(one, two) {
  one = one || dummyPoint;
  two = two || dummyPoint;
  return one !== two && (
    one.x !== two.x ||
    one.y !== two.y
  );
};

module.exports = pointsDiffer;
