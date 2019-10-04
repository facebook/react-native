/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const mergeInto = require('./mergeInto');

/**
 * Shallow merges two structures into a return value, without mutating either.
 *
 * @param {?object} one Optional object with properties to merge from.
 * @param {?object} two Optional object with properties to merge from.
 * @return {object} The shallow extension of one by two.
 */
const merge = function<T1, T2>(one: T1, two: T2): {...T1, ...T2} {
  const result = {};
  mergeInto(result, one);
  mergeInto(result, two);
  // $FlowFixMe mergeInto is not typed
  return result;
};

module.exports = merge;
