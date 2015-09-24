/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule processColor
 */
'use strict';

var tinycolor = require('tinycolor2');
var Platform = require('Platform');

function processColor(color) {
  if (!color || typeof color === 'number') {
    return color;
  } else if (color instanceof Array) {
    return color.map(processColor);
  } else {
    var hexString = tinycolor(color).toHex8();
    var colorInt = parseInt(hexString, 16);
    if (Platform.OS === 'android') {
      // Android use 32 bit *signed* integer to represent the color
      // We utilize the fact that bitwise operations in JS also operates on
      // signed 32 bit integers, so that we can use those to convert from
      // *unsiged* to *signed* 32bit int that way.
      colorInt = colorInt | 0x0;
    }
    return colorInt;
  }
}

module.exports = processColor;
