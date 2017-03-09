/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const leftPad = require('left-pad');

function toFixedHex(length: number, number: number): string {
  return leftPad(number.toString(16), length, '0');
}

module.exports = toFixedHex;
