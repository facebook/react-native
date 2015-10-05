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

var tinycolor = require('tinycolor');
var Platform = require('Platform');

/* eslint no-bitwise: 0 */
function processColor(color) {
  if (!color || typeof color === 'number') {
    return color;
  } else if (color instanceof Array) {
    return color.map(processColor);
  } else {
    var color = tinycolor(color);
    if (color.isValid()) {
      var rgb = color.toRgb();
      // All bitwise operations happen on 32-bit numbers, so we shift the 1 first
      // then multiply it with the actual value.
      var colorInt = Math.round(rgb.a * 255) * (1 << 24) + rgb.r * (1 << 16) + rgb.g * (1 << 8) + rgb.b;
      if (Platform.OS === 'android') {
        // Android use 32 bit *signed* integer to represent the color
        // We utilize the fact that bitwise operations in JS also operates on
        // signed 32 bit integers, so that we can use those to convert from
        // *unsiged* to *signed* 32bit int that way.
        colorInt = colorInt | 0x0;
      }
      return colorInt;
    }
    return 0;
  }
}

module.exports = processColor;
