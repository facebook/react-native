/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

const transformsDiffer = function(one, two) {
  return one !== two ||
    !one || !two ||
    one.length !== two.length ||
    JSON.stringify(one) !== JSON.stringify(two);
};

module.exports = transformsDiffer;
