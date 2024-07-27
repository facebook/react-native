/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

import processBackgroundImage from '../processBackgroundImage';

const processColor = require('../processColor').default;

describe('processBackgroundImage', () => {
  it('should process a simple linear gradient string', () => {
    const input = 'linear-gradient(to right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linearGradient',
        start: {x: 0, y: 0.5},
        end: {x: 1, y: 0.5},
        colorStops: [
          {color: processColor('red'), position: 0},
          {color: processColor('blue'), position: 1},
        ],
      },
    ]);
  });

  it('should process a linear gradient with angle', () => {
    const input = 'linear-gradient(45deg, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linearGradient');
    expect(result[0].start.x).toBeCloseTo(0.146447, 5);
    expect(result[0].start.y).toBeCloseTo(0.853553, 5);
    expect(result[0].end.x).toBeCloseTo(0.853553, 5);
    expect(result[0].end.y).toBeCloseTo(0.146447, 5);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should process a linear gradient with case-insensitive angle', () => {
    const input = 'linear-gradient(45Deg, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linearGradient');
    expect(result[0].start.x).toBeCloseTo(0.146447, 5);
    expect(result[0].start.y).toBeCloseTo(0.853553, 5);
    expect(result[0].end.x).toBeCloseTo(0.853553, 5);
    expect(result[0].end.y).toBeCloseTo(0.146447, 5);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should process a linear gradient with case-insensitive direction enum', () => {
    const input = 'linear-gradient(tO Right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].start).toEqual({x: 0, y: 0.5});
    expect(result[0].end).toEqual({x: 1, y: 0.5});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should process a linear gradient with case-insensitive colors', () => {
    const input =
      'linear-gradient(to right, Rgba(0, 0, 0, 0.5), Blue, Hsla(0, 100%, 50%, 0.5))';
    const result = processBackgroundImage(input);
    expect(result[0].start).toEqual({x: 0, y: 0.5});
    expect(result[0].end).toEqual({x: 1, y: 0.5});
    expect(result[0].colorStops).toEqual([
      {color: processColor('rgba(0, 0, 0, 0.5)'), position: 0},
      {color: processColor('blue'), position: 0.5},
      {color: processColor('hsla(0, 100%, 50%, 0.5)'), position: 1},
    ]);
  });

  it('should process multiple linear gradients', () => {
    const input =
      'linear-gradient(to right, red, blue), linear-gradient(to bottom, green, yellow)';
    const result = processBackgroundImage(input);
    expect(result).toHaveLength(2);
    expect(result[0].start).toEqual({x: 0, y: 0.5});
    expect(result[0].end).toEqual({x: 1, y: 0.5});
    expect(result[1].start).toEqual({x: 0.5, y: 0});
    expect(result[1].end).toEqual({x: 0.5, y: 1});
  });

  it('should process a linear gradient with multiple color stops', () => {
    const input = 'linear-gradient(to right, red 0%, green 50%, blue 100%)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('green'), position: 0.5},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should process a linear gradient with rgba colors', () => {
    const input =
      'linear-gradient(to right, rgba(255,0,0,0.5), rgba(0,0,255,0.8))';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('rgba(255,0,0,0.5)'), position: 0},
      {color: processColor('rgba(0,0,255,0.8)'), position: 1},
    ]);
  });

  it('should process a linear gradient with hsl colors', () => {
    const input = `linear-gradient(hsl(330, 100%, 45.1%), hsl(0, 100%, 50%))`;
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('hsl(330, 100%, 45.1%)'), position: 0},
      {color: processColor('hsl(0, 100%, 50%)'), position: 1},
    ]);
  });

  it('should process a linear gradient without direction', () => {
    const input = 'linear-gradient(#e66465, #9198e5)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('#e66465'), position: 0},
      {color: processColor('#9198e5'), position: 1},
    ]);
  });

  it('should process multiple gradients with spaces', () => {
    const input = `linear-gradient(to right , 
    rgba(255,0,0,0.5), rgba(0,0,255,0.8)),
              linear-gradient(to bottom , rgba(255,0,0,0.9)  , rgba(0,0,255,0.2)  )`;
    const result = processBackgroundImage(input);
    expect(result).toHaveLength(2);
    expect(result[0].start).toEqual({x: 0, y: 0.5});
    expect(result[0].end).toEqual({x: 1, y: 0.5});
    expect(result[1].start).toEqual({x: 0.5, y: 0});
    expect(result[1].end).toEqual({x: 0.5, y: 1});
    expect(result[0].colorStops).toEqual([
      {color: processColor('rgba(255,0,0,0.5)'), position: 0},
      {color: processColor('rgba(0,0,255,0.8)'), position: 1},
    ]);
    expect(result[1].colorStops).toEqual([
      {color: processColor('rgba(255,0,0,0.9)'), position: 0},
      {color: processColor('rgba(0,0,255,0.2)'), position: 1},
    ]);
  });

  it('should process an array of BackgroundPrimitive objects', () => {
    const input = [
      {
        type: 'linearGradient',
        start: {x: 0, y: 0},
        end: {x: 1, y: 1},
        colorStops: [
          {color: 'red', position: 0},
          {color: 'blue', position: 1},
        ],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linearGradient',
        start: {x: 0, y: 0},
        end: {x: 1, y: 1},
        colorStops: [
          {color: processColor('red'), position: 0},
          {color: processColor('blue'), position: 1},
        ],
      },
    ]);
  });
});
