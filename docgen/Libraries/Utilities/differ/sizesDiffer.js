/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
