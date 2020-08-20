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

const normalizeColorBase = require('../base');

it('should accept only spec compliant colors', () => {
  expect(normalizeColorBase('#abc')).not.toBe(null);
  expect(normalizeColorBase('#abcd')).not.toBe(null);
  expect(normalizeColorBase('#abcdef')).not.toBe(null);
  expect(normalizeColorBase('#abcdef01')).not.toBe(null);
  expect(normalizeColorBase('rgb(1,2,3)')).not.toBe(null);
  expect(normalizeColorBase('rgb(1, 2, 3)')).not.toBe(null);
  expect(normalizeColorBase('rgb(   1   , 2   , 3   )')).not.toBe(null);
  expect(normalizeColorBase('rgb(-1, -2, -3)')).not.toBe(null);
  expect(normalizeColorBase('rgba(0, 0, 0, 1)')).not.toBe(null);
  expect(normalizeColorBase(0x01234567 + 0.5)).toBe(null);
  expect(normalizeColorBase(-1)).toBe(null);
  expect(normalizeColorBase(0xffffffff + 1)).toBe(null);
});

it('should temporarily accept floating point values for rgb', () => {
  expect(normalizeColorBase('rgb(1.1, 2.1, 3.1)')).toBe(0x010203ff);
  expect(normalizeColorBase('rgba(1.1, 2.1, 3.1, 1.0)')).toBe(0x010203ff);
});

it('should refuse non spec compliant colors', () => {
  expect(normalizeColorBase('#00gg00')).toBe(null);
  expect(normalizeColorBase('rgb(1, 2, 3,)')).toBe(null);
  expect(normalizeColorBase('rgb(1, 2, 3')).toBe(null);

  // Used to be accepted by normalizeColorBase
  expect(normalizeColorBase('abc')).toBe(null);
  expect(normalizeColorBase(' #abc ')).toBe(null);
  expect(normalizeColorBase('##abc')).toBe(null);
  expect(normalizeColorBase('rgb 255 0 0')).toBe(null);
  expect(normalizeColorBase('RGBA(0, 1, 2)')).toBe(null);
  expect(normalizeColorBase('rgb (0, 1, 2)')).toBe(null);
  expect(normalizeColorBase('hsv(0, 1, 2)')).toBe(null);
  expect(normalizeColorBase({r: 10, g: 10, b: 10})).toBe(null);
  expect(normalizeColorBase('hsl(1%, 2, 3)')).toBe(null);
  expect(normalizeColorBase('rgb(1%, 2%, 3%)')).toBe(null);
});

it('should handle hex6 properly', () => {
  expect(normalizeColorBase('#000000')).toBe(0x000000ff);
  expect(normalizeColorBase('#ffffff')).toBe(0xffffffff);
  expect(normalizeColorBase('#ff00ff')).toBe(0xff00ffff);
  expect(normalizeColorBase('#abcdef')).toBe(0xabcdefff);
  expect(normalizeColorBase('#012345')).toBe(0x012345ff);
});

it('should handle hex3 properly', () => {
  expect(normalizeColorBase('#000')).toBe(0x000000ff);
  expect(normalizeColorBase('#fff')).toBe(0xffffffff);
  expect(normalizeColorBase('#f0f')).toBe(0xff00ffff);
});

it('should handle hex8 properly', () => {
  expect(normalizeColorBase('#00000000')).toBe(0x00000000);
  expect(normalizeColorBase('#ffffffff')).toBe(0xffffffff);
  expect(normalizeColorBase('#ffff00ff')).toBe(0xffff00ff);
  expect(normalizeColorBase('#abcdef01')).toBe(0xabcdef01);
  expect(normalizeColorBase('#01234567')).toBe(0x01234567);
});

it('should handle rgb properly', () => {
  expect(normalizeColorBase('rgb(0, 0, 0)')).toBe(0x000000ff);
  expect(normalizeColorBase('rgb(-1, -2, -3)')).toBe(0x000000ff);
  expect(normalizeColorBase('rgb(0, 0, 255)')).toBe(0x0000ffff);
  expect(normalizeColorBase('rgb(100, 15, 69)')).toBe(0x640f45ff);
  expect(normalizeColorBase('rgb(255, 255, 255)')).toBe(0xffffffff);
  expect(normalizeColorBase('rgb(256, 256, 256)')).toBe(0xffffffff);
});

it('should handle rgba properly', () => {
  expect(normalizeColorBase('rgba(0, 0, 0, 0.0)')).toBe(0x00000000);
  expect(normalizeColorBase('rgba(0, 0, 0, 0)')).toBe(0x00000000);
  expect(normalizeColorBase('rgba(0, 0, 0, -0.5)')).toBe(0x00000000);
  expect(normalizeColorBase('rgba(0, 0, 0, 1.0)')).toBe(0x000000ff);
  expect(normalizeColorBase('rgba(0, 0, 0, 1)')).toBe(0x000000ff);
  expect(normalizeColorBase('rgba(0, 0, 0, 1.5)')).toBe(0x000000ff);
  expect(normalizeColorBase('rgba(100, 15, 69, 0.5)')).toBe(0x640f4580);
});

it('should handle hsl properly', () => {
  expect(normalizeColorBase('hsl(0, 0%, 0%)')).toBe(0x000000ff);
  expect(normalizeColorBase('hsl(360, 100%, 100%)')).toBe(0xffffffff);
  expect(normalizeColorBase('hsl(180, 50%, 50%)')).toBe(0x40bfbfff);
  expect(normalizeColorBase('hsl(540, 50%, 50%)')).toBe(0x40bfbfff);
  expect(normalizeColorBase('hsl(70, 25%, 75%)')).toBe(0xcacfafff);
  expect(normalizeColorBase('hsl(70, 100%, 75%)')).toBe(0xeaff80ff);
  expect(normalizeColorBase('hsl(70, 110%, 75%)')).toBe(0xeaff80ff);
  expect(normalizeColorBase('hsl(70, 0%, 75%)')).toBe(0xbfbfbfff);
  expect(normalizeColorBase('hsl(70, -10%, 75%)')).toBe(0xbfbfbfff);
});

it('should handle hsla properly', () => {
  expect(normalizeColorBase('hsla(0, 0%, 0%, 0)')).toBe(0x00000000);
  expect(normalizeColorBase('hsla(360, 100%, 100%, 1)')).toBe(0xffffffff);
  expect(normalizeColorBase('hsla(360, 100%, 100%, 0)')).toBe(0xffffff00);
  expect(normalizeColorBase('hsla(180, 50%, 50%, 0.2)')).toBe(0x40bfbf33);
});

it('should handle named colors properly', () => {
  expect(normalizeColorBase('red')).toBe(0xff0000ff);
  expect(normalizeColorBase('transparent')).toBe(0x00000000);
  expect(normalizeColorBase('peachpuff')).toBe(0xffdab9ff);
});

it('should handle number colors properly', () => {
  expect(normalizeColorBase(0x00000000)).toBe(0x00000000);
  expect(normalizeColorBase(0xff0000ff)).toBe(0xff0000ff);
  expect(normalizeColorBase(0xffffffff)).toBe(0xffffffff);
  expect(normalizeColorBase(0x01234567)).toBe(0x01234567);
});

it("should return the same color when it's already normalized", () => {
  const normalizedColor = normalizeColorBase('red') || 0;
  expect(normalizeColorBase(normalizedColor)).toBe(normalizedColor);
});
