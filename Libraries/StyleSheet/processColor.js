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

function processColor(color) {
  if (!color || typeof color === 'number') {
    return color;
  } else if (color instanceof Array) {
    return color.map(processColor);
  } else {
    var hexString = tinycolor(color).toHex8();
    return parseInt(hexString, 16);
  }
}

module.exports = processColor;
