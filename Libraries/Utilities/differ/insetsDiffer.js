/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule insetsDiffer
 * @flow
 */
'use strict';

type Inset = {
  top: ?number,
  left: ?number,
  right: ?number,
  bottom: ?number,
}

var dummyInsets = {
	top: undefined,
	left: undefined,
	right: undefined,
	bottom: undefined,
};

var insetsDiffer = function(
  one: ?Inset,
  two: ?Inset
): bool {
  var insetOne = one || dummyInsets;
  var insetTwo = two || dummyInsets;
  return insetOne !== insetTwo && (
    insetOne.top !== insetTwo.top ||
    insetOne.left !== insetTwo.left ||
    insetOne.right !== insetTwo.right ||
    insetOne.bottom !== insetTwo.bottom
  );
};

module.exports = insetsDiffer;
