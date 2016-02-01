/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('normalizeColor');

var normalizeColor = require('normalizeColor');

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
  });

  it('should temporarly accept floating point values for rgb', function() {
    expect(normalizeColor('rgb(1.1, 2.1, 3.1)')).toBe(0xff010203);
    expect(normalizeColor('rgba(1.1, 2.1, 3.1, 1.0)')).toBe(0xff010203);
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
    expect(normalizeColor('#000000')).toBe(0xff000000);
    expect(normalizeColor('#ffffff')).toBe(0xffffffff);
    expect(normalizeColor('#ff00ff')).toBe(0xffff00ff);
    expect(normalizeColor('#abcdef')).toBe(0xffabcdef);
    expect(normalizeColor('#012345')).toBe(0xff012345);
  });

  it('should handle hex3 properly', function() {
    expect(normalizeColor('#000')).toBe(0xff000000);
    expect(normalizeColor('#fff')).toBe(0xffffffff);
    expect(normalizeColor('#f0f')).toBe(0xffff00ff);
  });

  it('should handle hex8 properly', function() {
    expect(normalizeColor('#00000000')).toBe(0x00000000);
    expect(normalizeColor('#ffffffff')).toBe(0xffffffff);
    expect(normalizeColor('#ffff00ff')).toBe(0xffffff00);
    expect(normalizeColor('#abcdef01')).toBe(0x01abcdef);
    expect(normalizeColor('#01234567')).toBe(0x67012345);
  });

  it('should handle rgb properly', function() {
    expect(normalizeColor('rgb(0, 0, 0)')).toBe(0xff000000);
    expect(normalizeColor('rgb(-1, -2, -3)')).toBe(0xff000000);
    expect(normalizeColor('rgb(0, 0, 255)')).toBe(0xff0000ff);
    expect(normalizeColor('rgb(100, 15, 69)')).toBe(0xff640f45);
    expect(normalizeColor('rgb(255, 255, 255)')).toBe(0xffffffff);
    expect(normalizeColor('rgb(256, 256, 256)')).toBe(0xffffffff);
  });

  it('should handle rgba properly', function() {
    expect(normalizeColor('rgba(0, 0, 0, 0.0)')).toBe(0x00000000);
    expect(normalizeColor('rgba(0, 0, 0, 0)')).toBe(0x00000000);
    expect(normalizeColor('rgba(0, 0, 0, -0.5)')).toBe(0x00000000);
    expect(normalizeColor('rgba(0, 0, 0, 1.0)')).toBe(0xff000000);
    expect(normalizeColor('rgba(0, 0, 0, 1)')).toBe(0xff000000);
    expect(normalizeColor('rgba(0, 0, 0, 1.5)')).toBe(0xff000000);
    expect(normalizeColor('rgba(100, 15, 69, 0.5)')).toBe(0x80640f45);
  });

  it('should handle hsl properly', function() {
    expect(normalizeColor('hsl(0, 0%, 0%)')).toBe(0xff000000);
    expect(normalizeColor('hsl(360, 100%, 100%)')).toBe(0xffffffff);
    expect(normalizeColor('hsl(180, 50%, 50%)')).toBe(0xff40bfbf);
    expect(normalizeColor('hsl(540, 50%, 50%)')).toBe(0xff40bfbf);
    expect(normalizeColor('hsl(70, 25%, 75%)')).toBe(0xffcacfaf);
    expect(normalizeColor('hsl(70, 100%, 75%)')).toBe(0xffeaff80);
    expect(normalizeColor('hsl(70, 110%, 75%)')).toBe(0xffeaff80);
    expect(normalizeColor('hsl(70, 0%, 75%)')).toBe(0xffbfbfbf);
    expect(normalizeColor('hsl(70, -10%, 75%)')).toBe(0xffbfbfbf);
  });

  it('should handle hsla properly', function() {
    expect(normalizeColor('hsla(0, 0%, 0%, 0)')).toBe(0x00000000);
    expect(normalizeColor('hsla(360, 100%, 100%, 1)')).toBe(0xffffffff);
    expect(normalizeColor('hsla(360, 100%, 100%, 0)')).toBe(0x00ffffff);
    expect(normalizeColor('hsla(180, 50%, 50%, 0.2)')).toBe(0x3340bfbf);
  });

  it('should handle named colors properly', function() {
    expect(normalizeColor('red')).toBe(0xffff0000);
    expect(normalizeColor('transparent')).toBe(0x00000000);
    expect(normalizeColor('peachpuff')).toBe(0xffffdab9);
  });
});
