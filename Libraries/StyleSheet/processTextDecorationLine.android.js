/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule processTextDecorationLine
 */

/* eslint no-bitwise: 0 */

'use strict';

const textDecorationLineBitFlags = {
  'none': 0,
  'underline': 1 << 0,
  'line-through': 1 << 1,
};

// textDecorationLine can be a string with a single enum value, a string with
// space-separated enum values, or an array of enum values.  Because ReactAndroid
// doesn't currently support an @ReactProp with multiple potential types, we convert
// it to an integer here in JS.
function processTextDecorationLine(value) {
  var array;
  if (Array.isArray(value)) {
    array = value;
  } else if (typeof value === 'string') {
    array = value.split(' ').filter((x) => x.length > 0);
  } else {
    throw new Error('Invalid type of textDecorationLine');
  }
  var bitField = 0;
  array.forEach((singleValueString) => {
    var singleValue = textDecorationLineBitFlags[singleValueString];
    if (singleValue === undefined) {
      throw new Error('Invalid value for textDecorationLine: ' + singleValueString);
    }
    bitField |= singleValue;
  });
  return bitField;
}

module.exports = processTextDecorationLine;
