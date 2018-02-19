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
  one = one || dummyInsets;
  two = two || dummyInsets;
  return one !== two && (
    one.top !== two.top ||
    one.left !== two.left ||
    one.right !== two.right ||
    one.bottom !== two.bottom
  );
};

module.exports = insetsDiffer;
