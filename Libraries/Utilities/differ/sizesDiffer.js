/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule sizesDiffer
 */
'use strict';

var dummySize = {width: undefined, height: undefined};

var sizesDiffer = function(one, two) {
  one = one || dummySize;
  two = two || dummySize;
  return one !== two && (
    one.width !== two.width ||
    one.height !== two.height
  );
};

module.exports = sizesDiffer;
