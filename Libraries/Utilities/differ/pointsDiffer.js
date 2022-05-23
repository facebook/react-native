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

type Point = {
  x: ?number,
  y: ?number,
  ...
};

const dummyPoint = {x: undefined, y: undefined};

const pointsDiffer = function(one: ?Point, two: ?Point): boolean {
  one = one || dummyPoint;
  two = two || dummyPoint;
  return one !== two && (one.x !== two.x || one.y !== two.y);
};

module.exports = pointsDiffer;
