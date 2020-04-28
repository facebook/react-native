/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const normalizeColor = require('../../Color/normalizeColor');

describe('normalizeColor', function() {
  it('should accept only spec compliant colors', function() {
    expect(normalizeColor('#abc')).not.toBe(null);
    expect(normalizeColor('#abcd')).not.toBe(null);
    expect(normalizeColor('#abcdef')).not.toBe(null);
    expect(normalizeColor('#abcdef01')).not.toBe(null);
    expect(normalizeColor('rgb(1,2,3)')).not.toBe(null);
    expect(normalizeColor('rgb(1, 2, 3)')).not.toBe(null);
    expect(normalizeColor('rgb(   1   , 2   , 3   )')).not.toBe(null);
    expect(normalizeColor('rgb(-1, -2, -3)')).not.toBe(null);
    expect(normalizeColor('rgba(0, 0, 0, 1)')).not.toBe(null);
    expect(normalizeColor(0x01234567 + 0.5)).toBe(null);
    expect(normalizeColor(-1)).toBe(null);
    expect(normalizeColor(0xffffffff + 1)).toBe(null);
  });

  it('should temporarily accept floating point values for rgb', function() {
    expect(normalizeColor('rgb(1.1, 2.1, 3.1)')).toBe(0x010203ff);
    expect(normalizeColor('rgba(1.1, 2.1, 3.1, 1.0)')).toBe(0x010203ff);
  });

  it('should refuse non spec compliant colors', function() {
    expect(normalizeColor('#00gg00')).toBe(null);
    expect(normalizeColor('rgb(1, 2, 3,)')).toBe(null);
    expect(normalizeColor('rgb(1, 2, 3')).toBe(null);

    // Used to be accepted by normalizeColor
    expect(normalizeColor('abc')).toBe(null);
    expect(normalizeColor(' #abc ')).toBe(null);
    expect(normalizeColor('##abc')).toBe(null);
    expect(normalizeColor('rgb 255 0 0')).toBe(null);
    expect(normalizeColor('RGBA(0, 1, 2)')).toBe(null);
    expect(normalizeColor('rgb (0, 1, 2)')).toBe(null);
    expect(normalizeColor('hsv(0, 1, 2)')).toBe(null);
    expect(normalizeColor({r: 10, g: 10, b: 10})).toBe(null);
    expect(normalizeColor('hsl(1%, 2, 3)')).toBe(null);
    expect(normalizeColor('rgb(1%, 2%, 3%)')).toBe(null);
  });

  it('should handle hex6 properly', function() {
    expect(normalizeColor('#000000')).toBe(0x000000ff);
    expect(normalizeColor('#ffffff')).toBe(0xffffffff);
    expect(normalizeColor('#ff00ff')).toBe(0xff00ffff);
    expect(normalizeColor('#abcdef')).toBe(0xabcdefff);
    expect(normalizeColor('#012345')).toBe(0x012345ff);
  });

  it('should handle hex3 properly', function() {
    expect(normalizeColor('#000')).toBe(0x000000ff);
    expect(normalizeColor('#fff')).toBe(0xffffffff);
    expect(normalizeColor('#f0f')).toBe(0xff00ffff);
  });

  it('should handle hex8 properly', function() {
    expect(normalizeColor('#00000000')).toBe(0x00000000);
    expect(normalizeColor('#ffffffff')).toBe(0xffffffff);
    expect(normalizeColor('#ffff00ff')).toBe(0xffff00ff);
    expect(normalizeColor('#abcdef01')).toBe(0xabcdef01);
    expect(normalizeColor('#01234567')).toBe(0x01234567);
  });

  it('should handle rgb properly', function() {
    expect(normalizeColor('rgb(0, 0, 0)')).toBe(0x000000ff);
    expect(normalizeColor('rgb(-1, -2, -3)')).toBe(0x000000ff);
    expect(normalizeColor('rgb(0, 0, 255)')).toBe(0x0000ffff);
    expect(normalizeColor('rgb(100, 15, 69)')).toBe(0x640f45ff);
    expect(normalizeColor('rgb(255, 255, 255)')).toBe(0xffffffff);
    expect(normalizeColor('rgb(256, 256, 256)')).toBe(0xffffffff);
  });

  it('should handle rgba properly', function() {
    expect(normalizeColor('rgba(0, 0, 0, 0.0)')).toBe(0x00000000);
    expect(normalizeColor('rgba(0, 0, 0, 0)')).toBe(0x00000000);
    expect(normalizeColor('rgba(0, 0, 0, -0.5)')).toBe(0x00000000);
    expect(normalizeColor('rgba(0, 0, 0, 1.0)')).toBe(0x000000ff);
    expect(normalizeColor('rgba(0, 0, 0, 1)')).toBe(0x000000ff);
    expect(normalizeColor('rgba(0, 0, 0, 1.5)')).toBe(0x000000ff);
    expect(normalizeColor('rgba(100, 15, 69, 0.5)')).toBe(0x640f4580);
  });

  it('should handle hsl properly', function() {
    expect(normalizeColor('hsl(0, 0%, 0%)')).toBe(0x000000ff);
    expect(normalizeColor('hsl(360, 100%, 100%)')).toBe(0xffffffff);
    expect(normalizeColor('hsl(180, 50%, 50%)')).toBe(0x40bfbfff);
    expect(normalizeColor('hsl(540, 50%, 50%)')).toBe(0x40bfbfff);
    expect(normalizeColor('hsl(70, 25%, 75%)')).toBe(0xcacfafff);
    expect(normalizeColor('hsl(70, 100%, 75%)')).toBe(0xeaff80ff);
    expect(normalizeColor('hsl(70, 110%, 75%)')).toBe(0xeaff80ff);
    expect(normalizeColor('hsl(70, 0%, 75%)')).toBe(0xbfbfbfff);
    expect(normalizeColor('hsl(70, -10%, 75%)')).toBe(0xbfbfbfff);
  });

  it('should handle hsla properly', function() {
    expect(normalizeColor('hsla(0, 0%, 0%, 0)')).toBe(0x00000000);
    expect(normalizeColor('hsla(360, 100%, 100%, 1)')).toBe(0xffffffff);
    expect(normalizeColor('hsla(360, 100%, 100%, 0)')).toBe(0xffffff00);
    expect(normalizeColor('hsla(180, 50%, 50%, 0.2)')).toBe(0x40bfbf33);
  });

  it('should handle named colors properly', function() {
    expect(normalizeColor('red')).toBe(0xff0000ff);
    expect(normalizeColor('transparent')).toBe(0x00000000);
    expect(normalizeColor('peachpuff')).toBe(0xffdab9ff);
  });

  it('should handle number colors properly', function() {
    expect(normalizeColor(0x00000000)).toBe(0x00000000);
    expect(normalizeColor(0xff0000ff)).toBe(0xff0000ff);
    expect(normalizeColor(0xffffffff)).toBe(0xffffffff);
    expect(normalizeColor(0x01234567)).toBe(0x01234567);
  });

  it("should return the same color when it's already normalized", function() {
    const normalizedColor = normalizeColor('red') || 0;
    expect(normalizeColor(normalizedColor)).toBe(normalizedColor);
  });
});
