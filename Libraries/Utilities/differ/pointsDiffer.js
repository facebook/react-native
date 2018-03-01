/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule pointsDiffer
 * @flow
 */
'use strict';

type Point = {
  x: ?number,
  y: ?number,
}

var dummyPoint = {x: undefined, y: undefined};

var pointsDiffer = function(one: ?Point, two: ?Point): bool {
  one = one || dummyPoint;
  two = two || dummyPoint;
  return one !== two && (
    one.x !== two.x ||
    one.y !== two.y
  );
};

module.exports = pointsDiffer;
