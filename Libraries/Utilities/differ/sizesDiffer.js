/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule sizesDiffer
 */
'use strict';

var dummySize = {w: undefined, h: undefined};

var sizesDiffer = function(one, two) {
  one = one || dummySize;
  two = two || dummySize;
  return one !== two && (
    one.w !== two.w ||
    one.h !== two.h
  );
};

module.exports = sizesDiffer;
