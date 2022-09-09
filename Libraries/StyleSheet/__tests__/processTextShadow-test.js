/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const processTextShadow = require('../processTextShadow');

describe('processTextShadow', () => {
  it('should accept string with xOffset, yOffset, blurRadius and color literal', () => {
    expect(processTextShadow('1 1 1 red')).toMatchObject({
      xOffset: 1,
      yOffset: 1,
      blurRadius: 1,
      color: 'red',
    });
  });

  it('should accept string with xOffset, yOffset and color in rgb/rgba format', () => {
    expect(processTextShadow('1 1 rgba(200, 20, 10, 0.2)')).toMatchObject({
      xOffset: 1,
      yOffset: 1,
      color: 'rgba(200, 20, 10, 0.2)',
    });
  });

  it('should accept string with xOffset and color in hex', () => {
    expect(processTextShadow('1 #ffffff')).toMatchObject({
      xOffset: 1,
      color: '#ffffff',
    });
  });

  it('should accept string with only color in hsl format', () => {
    expect(processTextShadow('hsl(200, 10%, 100%)')).toMatchObject({
      color: 'hsl(200, 10%, 100%)',
    });
  });

  it('should accept string with only xOffset', () => {
    expect(processTextShadow('1')).toMatchObject({
      xOffset: 1,
    });
  });

  it('should accept string with negative xOffset in decimal, yOffset in decimal', () => {
    expect(processTextShadow('-3.5 1.1')).toMatchObject({
      xOffset: -3.5,
      yOffset: 1.1,
    });
  });

  it('should accept string with xOffset, yOffset and blurRadius', () => {
    expect(processTextShadow('2.0 4 -55')).toMatchObject({
      xOffset: 2,
      yOffset: 4,
      blurRadius: -55,
    });
  });

  it('should accept string with xOffset in decimal, negative yOffset, blurRadius and color', () => {
    expect(processTextShadow('12.1 -30 9 rgb(0,0,0)')).toMatchObject({
      xOffset: 12.1,
      yOffset: -30,
      blurRadius: 9,
      color: 'rgb(0,0,0)',
    });
  });

  it('should ignore invalid values', () => {
    expect(processTextShadow('11 r b r')).toMatchObject({xOffset: undefined});
  });
});
