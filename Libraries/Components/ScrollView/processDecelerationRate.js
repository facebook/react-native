/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule processDecelerationRate
 */
'use strict';

function processDecelerationRate(decelerationRate) {
  if (decelerationRate === 'normal') {
    decelerationRate = 0.998;
  } else if (decelerationRate === 'fast') {
    decelerationRate = 0.99;
  }
  return decelerationRate;
}

module.exports = processDecelerationRate;
