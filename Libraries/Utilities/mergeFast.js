/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule mergeFast
 */
'use strict';

/**
 * Faster version of `merge` that doesn't check its arguments and
 * also merges prototye inherited properties.
 *
 * @param {object} one Any non-null object.
 * @param {object} two Any non-null object.
 * @return {object} Merging of two objects, including prototype
 * inherited properties.
 */
var mergeFast = function(one, two) {
  var ret = {};
  for (var keyOne in one) {
    ret[keyOne] = one[keyOne];
  }
  for (var keyTwo in two) {
    ret[keyTwo] = two[keyTwo];
  }
  return ret;
};

module.exports = mergeFast;
