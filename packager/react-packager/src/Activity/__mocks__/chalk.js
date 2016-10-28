/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const mockColor = () => {
  return {
    bold: () => { return { }; },
  };
};

mockColor.bold = function() {
  return {};
};

mockColor.bgRed = function() {
  return {};
};

module.exports = {
  dim: s =>  s,
  magenta: mockColor,
  white: mockColor,
  blue: mockColor,
  yellow: mockColor,
  green: mockColor,
  bold: mockColor,
  red: mockColor,
  cyan: mockColor,
  gray: mockColor,
  black: mockColor,
};
