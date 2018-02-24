/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule processColor
 * @flow
 */
'use strict';

const Platform = require('Platform');

const normalizeColor = require('normalizeColor');

/* eslint no-bitwise: 0 */
function processColor(color?: string | number): ?number {
  if (color === undefined || color === null) {
    return color;
  }

  let int32Color = normalizeColor(color);
  if (int32Color === null || int32Color === undefined) {
    return undefined;
  }

  // Converts 0xrrggbbaa into 0xaarrggbb
  int32Color = (int32Color << 24 | int32Color >>> 8) >>> 0;

  if (Platform.OS === 'android') {
    // Android use 32 bit *signed* integer to represent the color
    // We utilize the fact that bitwise operations in JS also operates on
    // signed 32 bit integers, so that we can use those to convert from
    // *unsigned* to *signed* 32bit int that way.
    int32Color = int32Color | 0x0;
  }
  return int32Color;
}

module.exports = processColor;
