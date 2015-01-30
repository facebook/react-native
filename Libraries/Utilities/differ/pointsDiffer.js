/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule pointsDiffer
 */
'use strict';

var dummyPoint = {x: undefined, y: undefined};

var pointsDiffer = function(one, two) {
  one = one || dummyPoint;
  two = two || dummyPoint;
  return one !== two && (
    one.x !== two.x ||
    one.y !== two.y
  );
};

module.exports = pointsDiffer;
