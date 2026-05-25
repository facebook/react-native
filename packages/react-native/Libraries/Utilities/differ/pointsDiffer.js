/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

type Point = {
  x: ?number,
  y: ?number,
  ...
};

const dummyPoint: Point = {x: undefined, y: undefined};

/**
 * Compares two point objects for equality.
 * Returns true if the points are different, false if equal.
 *
 * @param {?Point} one - First point object
 * @param {?Point} two - Second point object  
 * @returns {boolean} True if points differ, false if equal
 */
function pointsDiffer(one: ?Point, two: ?Point): boolean {
  one = one || dummyPoint;
  two = two || dummyPoint;
  return one !== two && (one.x !== two.x || one.y !== two.y);
}

export default pointsDiffer;
