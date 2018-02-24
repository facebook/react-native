/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule getObjectValues
 * @typechecks
 */
'use strict';

/**
 * Retrieve an object's values as an array.
 *
 * If you are looking for a function that creates an Array instance based
 * on an "Array-like" object, use createArrayFrom instead.
 *
 * @param {object} obj An object.
 * @return {array}     The object's values.
 */
function getObjectValues(obj) {
  var values = [];
  for (var key in obj) {
    values.push(obj[key]);
  }
  return values;
}

module.exports = getObjectValues;
