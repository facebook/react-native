/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule IndicatorSizePropType
 */
'use strict';

var ReactPropTypeLocationNames = require('react/lib/ReactPropTypeLocationNames');

var indicatorSizePropType = function(isRequired, props, propName, componentName, location, propFullName) {
  var size = props[propName];

  if (size !== undefined && size !== null && typeof size !== 'number' && size !== 'small' && size !== 'large') {
    var locationName = ReactPropTypeLocationNames[location];
    return new Error(
        'Invalid ' + ReactPropTypeLocationNames[location] + ' `' + (propFullName || propName) +
        '` supplied to `' + componentName + '`: ' + size + '\n' +
  `Valid size formats are
    - 'small'
    - 'large'
    - positive number
  `);
  }

  if (typeof size === 'number') {
    if (size <= 0) {
      return new Error(
        'Size number has to be greater than 0. Default size will be used'
      );
    }
  }

};

var IndicatorSizePropType = indicatorSizePropType.bind(null, false);
module.exports = IndicatorSizePropType;
