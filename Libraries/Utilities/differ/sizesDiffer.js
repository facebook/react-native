/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const dummySize = {width: undefined, height: undefined};

const sizesDiffer = function(one, two) {
  one = one || dummySize;
  two = two || dummySize;
  return one !== two && (one.width !== two.width || one.height !== two.height);
};

module.exports = sizesDiffer;
