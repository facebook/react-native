/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule mergeIntoFast
 */
'use strict';

/**
 * Faster version of `mergeInto` that doesn't check its arguments and
 * also copies over prototye inherited properties.
 *
 * @param {object} one Object to assign to.
 * @param {object} two Object to assign from.
 */
var mergeIntoFast = function(one, two) {
  for (var keyTwo in two) {
    one[keyTwo] = two[keyTwo];
  }
};

module.exports = mergeIntoFast;
