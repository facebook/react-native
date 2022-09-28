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
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should accept string with xOffset, yOffset, blurRadius and color literal', () => {
    expect(processTextShadow('1 1px 1em red')).toMatchObject({
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

  it('should accept string with xOffset, yOffset and color in hsl/hsla format', () => {
    expect(processTextShadow('2px 3px 3px hsl(10, 20% 30%)')).toMatchObject({
      xOffset: 2,
      yOffset: 3,
      blurRadius: 3,
      color: 'hsl(10, 20% 30%)',
    });
  });

  it('should accept string with xOffset, yOffset and color in hex', () => {
    expect(processTextShadow('1.1 -12px #ffffff')).toMatchObject({
      xOffset: 1.1,
      yOffset: -12,
      color: '#ffffff',
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

  it('should accept only first shadow value and show warning when multiple shadows are passed', () => {
    const mockWarn = jest.spyOn(console, 'warn');
    expect(
      processTextShadow('12.1em -30px 9px rgb(0,0,0), 1px 3px 4px red'),
    ).toMatchObject({
      xOffset: 12.1,
      yOffset: -30,
      blurRadius: 9,
      color: 'rgb(0,0,0)',
    });
    expect(mockWarn).toHaveBeenCalled();
  });

  it('should accept string with color before offsets', () => {
    expect(processTextShadow('red 1px 2px')).toMatchObject({
      xOffset: 1,
      yOffset: 2,
      color: 'red',
    });
  });

  it('should accept string with color before offsets and blur radius', () => {
    expect(processTextShadow('red 1px -2px 2.2em')).toMatchObject({
      xOffset: 1,
      yOffset: -2,
      blurRadius: 2.2,
      color: 'red',
    });
  });

  it('should ignore invalid values', () => {
    expect(processTextShadow('1 x x x')).toMatchObject({});
  });
});
