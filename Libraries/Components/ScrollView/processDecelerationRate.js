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

var ScrollViewConsts = require('UIManager').RCTScrollView.Constants;

function processDecelerationRate(decelerationRate) {
  var ScrollViewDecelerationRateNormal = ScrollViewConsts && ScrollViewConsts.DecelerationRate.normal;
  var ScrollViewDecelerationRateFast = ScrollViewConsts && ScrollViewConsts.DecelerationRate.fast;

  if (typeof decelerationRate === 'string') {
    if (decelerationRate === 'fast') {
      return ScrollViewDecelerationRateFast;
    } else if (decelerationRate === 'normal') {
      return ScrollViewDecelerationRateNormal;
    }
  }
  return decelerationRate;
}

module.exports = processDecelerationRate;
