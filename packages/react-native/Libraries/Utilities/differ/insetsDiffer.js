/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

type Inset = {
  top: ?number,
  left: ?number,
  right: ?number,
  bottom: ?number,
  ...
};

const dummyInsets = {
  top: undefined,
  left: undefined,
  right: undefined,
  bottom: undefined,
};

function insetsDiffer(one: Inset, two: Inset): boolean {
  one = one || dummyInsets;
  two = two || dummyInsets;
  return (
    one !== two &&
    (one.top !== two.top ||
      one.left !== two.left ||
      one.right !== two.right ||
      one.bottom !== two.bottom)
  );
}

export default insetsDiffer;
