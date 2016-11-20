/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
