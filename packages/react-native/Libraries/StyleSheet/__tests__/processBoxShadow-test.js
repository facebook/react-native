/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import processBoxShadow from '../processBoxShadow';
import processColor from '../processColor';

// js1 test processBoxShadow
describe('processBoxShadow', () => {
  it('should parse basic string', () => {
    expect(processBoxShadow('10px 5')).toEqual([
      {
        offsetX: 10,
        offsetY: 5,
      },
    ]);
  });

  it('should parse basic string with multiple whitespaces', () => {
    expect(processBoxShadow('10px    5')).toEqual([
      {
        offsetX: 10,
        offsetY: 5,
      },
    ]);
  });

  it('should parse string with color', () => {
    expect(processBoxShadow('red 10 5')).toEqual([
      {
        color: processColor('red'),
        offsetX: 10,
        offsetY: 5,
      },
    ]);
  });

  it('should parse string with color function rgba', () => {
    expect(processBoxShadow('rgba(255, 255, 255, 0.5) 10 5')).toEqual([
      {
        color: processColor('rgba(255, 255, 255, 0.5)'),
        offsetX: 10,
        offsetY: 5,
      },
    ]);
  });

  it('should parse string with color function hsl', () => {
    expect(processBoxShadow('hsl(318, 69%, 55%) 10 5')).toEqual([
      {
        color: processColor('hsl(318, 69%, 55%)'),
        offsetX: 10,
        offsetY: 5,
      },
    ]);
  });

  it('should parse string with hex color', () => {
    expect(processBoxShadow('#FFFFFF 10 5')).toEqual([
      {
        color: processColor('#FFFFFF'),
        offsetX: 10,
        offsetY: 5,
      },
    ]);
  });

  it('should parse string with blurRadius', () => {
    expect(processBoxShadow('red 10 5 2')).toEqual([
      {
        color: processColor('red'),
        blurRadius: 2,
        offsetX: 10,
        offsetY: 5,
      },
    ]);
  });

  it('should parse string with spreadDistance', () => {
    expect(processBoxShadow('red 10 5 2 3')).toEqual([
      {
        color: processColor('red'),
        blurRadius: 2,
        offsetX: 10,
        offsetY: 5,
        spreadDistance: 3,
      },
    ]);
  });

  it('should parse string arguments with units', () => {
    expect(processBoxShadow('5px 2px')).toEqual([
      {
        offsetX: 5,
        offsetY: 2,
      },
    ]);
  });

  it('should parse string with inset', () => {
    expect(processBoxShadow('5px 2px inset')).toEqual([
      {
        offsetX: 5,
        offsetY: 2,
        inset: true,
      },
    ]);
  });

  it('should parse string with inset and color before and after lengths', () => {
    expect(processBoxShadow('red 10 10 inset')).toEqual([
      {
        color: processColor('red'),
        offsetX: 10,
        offsetY: 10,
        inset: true,
      },
    ]);
  });

  it('should parse multiple box shadow strings', () => {
    expect(
      processBoxShadow('10 5 red, 5 12 inset, inset 10 45 13 red'),
    ).toEqual([
      {
        offsetX: 10,
        offsetY: 5,
        color: processColor('red'),
      },
      {
        offsetX: 5,
        offsetY: 12,
        inset: true,
      },
      {
        offsetX: 10,
        offsetY: 45,
        blurRadius: 13,
        inset: true,
        color: processColor('red'),
      },
    ]);
  });

  it('should parse multiple box shadow strings with newlines', () => {
    expect(
      processBoxShadow('10 5 red, 5 12 inset,\n  inset 10 45 13 red'),
    ).toEqual([
      {
        offsetX: 10,
        offsetY: 5,
        color: processColor('red'),
      },
      {
        offsetX: 5,
        offsetY: 12,
        inset: true,
      },
      {
        offsetX: 10,
        offsetY: 45,
        blurRadius: 13,
        inset: true,
        color: processColor('red'),
      },
    ]);
  });

  it('should fail to parse string with invalid units', () => {
    expect(processBoxShadow('red 10em 5$ 2| 3rp')).toEqual([]);
  });

  it('should fail to parse too many lengths', () => {
    expect(processBoxShadow('10 5 2 3 10 10')).toEqual([]);
  });

  it('should fail to parse inset between lengths', () => {
    expect(processBoxShadow('10 inset 5 2 3,')).toEqual([]);
  });

  it('should fail to parse double color', () => {
    expect(processBoxShadow('red red 10 5')).toEqual([]);
  });

  it('should fail to parse double inset', () => {
    expect(processBoxShadow('10 5 inset inset')).toEqual([]);
  });

  it('should fail to parse color between lengths', () => {
    expect(processBoxShadow('10 red 5 2 3,')).toEqual([]);
  });

  it('should fail to parse invalid unit', () => {
    expect(processBoxShadow('red 10foo 5 2 3,')).toEqual([]);
  });

  it('should fail to parse invalid argument', () => {
    expect(processBoxShadow('red asf 5 2 3')).toEqual([]);
  });

  it('should fail to parse negative blur', () => {
    expect(processBoxShadow('red 5 2 -3')).toEqual([]);
  });

  it('should parse simple object', () => {
    expect(
      processBoxShadow([
        {
          offsetX: 10,
          offsetY: 5,
        },
      ]),
    ).toEqual([
      {
        offsetX: 10,
        offsetY: 5,
      },
    ]);
  });

  it('should parse object with color', () => {
    expect(
      processBoxShadow([
        {
          offsetX: 10,
          offsetY: 5,
          color: 'red',
        },
      ]),
    ).toEqual([
      {
        offsetX: 10,
        offsetY: 5,
        color: processColor('red'),
      },
    ]);
  });

  it('should parse complex box shadow', () => {
    expect(
      processBoxShadow([
        {
          offsetX: '10px',
          offsetY: 5,
          blurRadius: 2,
          spreadDistance: 3,
          inset: true,
          color: '#FFFFFF',
        },
      ]),
    ).toEqual([
      {
        offsetX: 10,
        offsetY: 5,
        blurRadius: 2,
        spreadDistance: 3,
        inset: true,
        color: processColor('#FFFFFF'),
      },
    ]);
  });

  it('should fail to parse object with negative blur', () => {
    expect(
      processBoxShadow([
        {
          offsetX: 10,
          offsetY: 5,
          color: 'red',
          blurRadius: -3,
        },
      ]),
    ).toEqual([]);
  });

  it('should fail to parse object with invalid argument', () => {
    expect(
      processBoxShadow([
        {
          offsetX: 10,
          offsetY: 'asdf',
        },
      ]),
    ).toEqual([]);
  });
});
