/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+react_native
 */
'use strict';

var setNormalizedColorAlpha = require('setNormalizedColorAlpha');
var normalizeColor = require('normalizeColor');

describe('setNormalizedColorAlpha', function() {
  it('should adjust the alpha of the color passed in', function() {
    expect(setNormalizedColorAlpha(0xffffffff, 0.4)).toBe(0xffffff66);
    expect(setNormalizedColorAlpha(0x204080ff, 0.6)).toBe(0x20408099);
  });

  it('should clamp invalid input', function() {
    expect(setNormalizedColorAlpha(0xffffffff, 1.5)).toBe(0xffffffff);
    expect(setNormalizedColorAlpha(0xffffffff, -1)).toBe(0xffffff00);
  });

  it('should ignore the color\'s original alpha', function() {
    expect(setNormalizedColorAlpha(0x204080aa, 0.8)).toBe(0x204080cc);
  });

  it('should return the original color when alpha is unchanged', function() {
    var originalColor = normalizeColor('blue');
    expect(setNormalizedColorAlpha(originalColor, 1)).toBe(originalColor);
  });
});
