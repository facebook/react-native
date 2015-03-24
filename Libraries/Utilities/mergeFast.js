/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule mergeFast
 * @flow
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
var mergeFast = function(one: Object, two: Object): Object {
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
