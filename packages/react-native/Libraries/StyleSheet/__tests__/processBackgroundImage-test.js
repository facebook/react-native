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

const {OS} = require('../../Utilities/Platform');
const PlatformColorAndroid =
  require('../PlatformColorValueTypes.android').PlatformColor;
const PlatformColorIOS =
  require('../PlatformColorValueTypes.ios').PlatformColor;
const DynamicColorIOS =
  require('../PlatformColorValueTypesIOS.ios').DynamicColorIOS;
const processColor = require('../processColor').default;

describe('processBackgroundImage', () => {
  it('should process a simple linear gradient string', () => {
    const input = 'linear-gradient(to right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linearGradient',
        direction: {type: 'angle', value: 90},
        colorStops: [
          {color: processColor('red'), position: 0},
          {color: processColor('blue'), position: 1},
        ],
      },
    ]);
  });

  it('should process a diagonal linear gradient', () => {
    const input = 'linear-gradient(to bottom right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linearGradient',
        direction: {type: 'keyword', value: 'to bottom right'},
        colorStops: [
          {color: processColor('red'), position: 0},
          {color: processColor('blue'), position: 1},
        ],
      },
    ]);
  });

  it('should return empty array for null values', () => {
    let result = processBackgroundImage('');
    expect(result).toEqual([]);
    result = processBackgroundImage(null);
    expect(result).toEqual([]);
    result = processBackgroundImage(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid values', () => {
    let result = processBackgroundImage('linear-');
    expect(result).toEqual([]);
  });

  it('should process a linear gradient with whitespaces in direction keyword', () => {
    const input = 'linear-gradient(to   bottom   right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linearGradient',
        direction: {type: 'keyword', value: 'to bottom right'},
        colorStops: [
          {color: processColor('red'), position: 0},
          {color: processColor('blue'), position: 1},
        ],
      },
    ]);
  });

  it('should process a linear gradient with random whitespaces', () => {
    const input =
      ' linear-gradient(to   bottom   right,  red  30%,  blue  80%) ';
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linearGradient',
        direction: {type: 'keyword', value: 'to bottom right'},
        colorStops: [
          {color: processColor('red'), position: 0.3},
          {color: processColor('blue'), position: 0.8},
        ],
      },
    ]);
  });

  it('should process a linear gradient with angle', () => {
    const input = 'linear-gradient(45deg, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linearGradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 45});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should process a linear gradient with case-insensitive angle', () => {
    const input = 'linear-gradient(45Deg, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linearGradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 45});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should process a linear gradient object style with case-insensitive direction keyword', () => {
    const input = [
      {
        type: 'linearGradient',
        direction: 'To Bottom',
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linearGradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 180});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should process a linear gradient object style with case-insensitive angle', () => {
    const input = [
      {
        type: 'linearGradient',
        direction: '45DEG',
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linearGradient');
    expect(result[0].direction).toEqual({type: 'angle', value: 45});
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('linear gradient case-insensitive string', () => {
    const input = 'LiNeAr-GradieNt(To Bottom, Red, Blue)';
    const result = processBackgroundImage(input);
    expect(result[0].type).toBe('linearGradient');
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 180,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should process a linear gradient with case-insensitive direction enum', () => {
    const input = 'linear-gradient(tO Right, red, blue)';
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 90,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should process a linear gradient with case-insensitive colors', () => {
    const input =
      'linear-gradient(TO LEFT, Rgba(0, 0, 0, 0.5), Blue, Hsla(0, 100%, 50%, 0.5))';
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 270,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('rgba(0, 0, 0, 0.5)'), position: 0},
      {color: processColor('blue'), position: 0.5},
      {color: processColor('hsla(0, 100%, 50%, 0.5)'), position: 1},
    ]);
  });

  it('should process multiple linear gradients', () => {
    const input = `
      linear-gradient(to top, red, blue),
      linear-gradient(to bottom, green, yellow)`;
    const result = processBackgroundImage(input);
    expect(result).toHaveLength(2);
    expect(result[0].type).toEqual('linearGradient');
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 0,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
    expect(result[1].type).toEqual('linearGradient');
    expect(result[1].direction).toEqual({
      type: 'angle',
      value: 180,
    });

    expect(result[1].colorStops).toEqual([
      {color: processColor('green'), position: 0},
      {color: processColor('yellow'), position: 1},
    ]);
  });

  it('should process multiple linear gradients with newlines', () => {
    const input = `
      linear-gradient(to left, red, blue),\n
      linear-gradient(to bottom, green, yellow)`;
    const result = processBackgroundImage(input);
    expect(result).toHaveLength(2);
    expect(result[0].type).toEqual('linearGradient');
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 270,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('blue'), position: 1},
    ]);
    expect(result[1].type).toEqual('linearGradient');
    expect(result[1].direction).toEqual({
      type: 'angle',
      value: 180,
    });

    expect(result[1].colorStops).toEqual([
      {color: processColor('green'), position: 0},
      {color: processColor('yellow'), position: 1},
    ]);
  });

  it('should process a linear gradient with multiple color stops', () => {
    const input = 'linear-gradient(to bottom, red 0%, green 50%, blue 100%)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('green'), position: 0.5},
      {color: processColor('blue'), position: 1},
    ]);
  });

  it('should add color stop postion if position is not specified', () => {
    const input =
      'linear-gradient(to right, red, green, blue 60%, yellow, purple)';
    const result = processBackgroundImage(input);
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0},
      {color: processColor('green'), position: 0.3},
      {color: processColor('blue'), position: 0.6},
      {color: processColor('yellow'), position: 0.8},
      {color: processColor('purple'), position: 1},
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
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 90,
    });
    expect(result[1].direction).toEqual({
      type: 'angle',
      value: 180,
    });
    expect(result[0].colorStops).toEqual([
      {color: processColor('rgba(255,0,0,0.5)'), position: 0},
      {color: processColor('rgba(0,0,255,0.8)'), position: 1},
    ]);
    expect(result[1].colorStops).toEqual([
      {color: processColor('rgba(255,0,0,0.9)'), position: 0},
      {color: processColor('rgba(0,0,255,0.2)'), position: 1},
    ]);
  });

  it('should return empty array for invalid color in linear gradient', () => {
    const input = 'linear-gradient(45deg, rede, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid angle in linear gradient', () => {
    const input = 'linear-gradient(45 deg, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid direction enum in linear gradient', () => {
    const input = 'linear-gradient(to left2, red, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid color stop unit', () => {
    const input = 'linear-gradient(to left, red 5, blue)';
    const result = processBackgroundImage(input);
    expect(result).toEqual([]);
  });

  it('should process an array of style objects', () => {
    const input = [
      {
        type: 'linearGradient',
        direction: 'to bottom right',
        colorStops: [
          {color: 'red', positions: ['0%']},
          {color: 'blue', positions: ['100%']},
        ],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result).toEqual([
      {
        type: 'linearGradient',
        direction: {type: 'keyword', value: 'to bottom right'},
        colorStops: [
          {color: processColor('red'), position: 0},
          {color: processColor('blue'), position: 1},
        ],
      },
    ]);
  });

  it('should process an style object with default direction', () => {
    const input = [
      {
        type: 'linearGradient',
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 180,
    });
  });

  it('should process style object with direction enum', () => {
    const input = [
      {
        type: 'linearGradient',
        direction: 'to right',
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 90,
    });
  });

  it('should process style object with direction angle', () => {
    const input = [
      {
        type: 'linearGradient',
        direction: '45deg',
        colorStops: [{color: 'red'}, {color: 'blue'}],
      },
    ];
    const result = processBackgroundImage(input);
    expect(result[0].direction).toEqual({
      type: 'angle',
      value: 45,
    });
  });

  it('should fix up stop positions #1', () => {
    const input = [
      {
        type: 'linearGradient',
        colorStops: [
          {color: 'red', positions: ['40%']},
          {color: 'blue'},
          {color: 'green'},
          {color: 'purple'},
        ],
      },
    ];
    const output = [
      {
        color: processColor('red'),
        position: 0.4,
      },
      {
        color: processColor('blue'),
        position: 0.6,
      },
      {
        color: processColor('green'),
        position: 0.8,
      },
      {
        color: processColor('purple'),
        position: 1,
      },
    ];
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(
      `linear-gradient(red 40%, blue, green, purple)`,
    );
    expect(result[0].colorStops).toEqual(output);
    expect(result1[0].colorStops).toEqual(output);
  });

  it('should process multiple stop positions', () => {
    const input = [
      {
        type: 'linearGradient',
        colorStops: [
          {color: 'red', positions: ['40%', '80%']},
          {color: 'blue'},
          {color: 'green'},
        ],
      },
    ];
    const result = processBackgroundImage(input);
    const result2 = processBackgroundImage(
      `linear-gradient(red 40%  80%, blue, green)`,
    );
    const output = [
      {
        color: processColor('red'),
        position: 0.4,
      },
      {
        color: processColor('red'),
        position: 0.8,
      },
      {
        color: processColor('blue'),
        position: 0.9,
      },
      {
        color: processColor('green'),
        position: 1,
      },
    ];
    expect(result[0].colorStops).toEqual(output);
    expect(result2[0].colorStops).toEqual(output);
  });

  it('should fix up stop positions #2', () => {
    const input = [
      {
        type: 'linearGradient',
        colorStops: [
          {color: 'red'},
          {color: 'blue', positions: ['20%']},
          {color: 'green'},
        ],
      },
    ];
    const output = [
      {
        color: processColor('red'),
        position: 0,
      },
      {
        color: processColor('blue'),
        position: 0.2,
      },
      {
        color: processColor('green'),
        position: 1,
      },
    ];
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(
      `linear-gradient(red , blue  20%, green)`,
    );
    expect(result[0].colorStops).toEqual(output);
    expect(result1[0].colorStops).toEqual(output);
  });

  it('should fix up stop positions #3', () => {
    const input = [
      {
        type: 'linearGradient',
        colorStops: [
          {color: 'red', positions: ['-50%']},
          {color: 'blue'},
          {color: 'green'},
        ],
      },
    ];
    const output = [
      {
        color: processColor('red'),
        position: -0.5,
      },
      {
        color: processColor('blue'),
        position: 0.25,
      },
      {
        color: processColor('green'),
        position: 1,
      },
    ];
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(
      `linear-gradient(red -50%, blue, green)`,
    );
    expect(result[0].colorStops).toEqual(output);
    expect(result1[0].colorStops).toEqual(output);
  });

  it('should fix up stop positions #4', () => {
    const input = [
      {
        type: 'linearGradient',
        colorStops: [
          {color: 'red'},
          {color: 'blue', positions: ['-50%']},
          {color: 'green', positions: ['150%']},
          {color: 'yellow'},
        ],
      },
    ];
    const output = [
      {
        color: processColor('red'),
        position: 0,
      },
      {
        color: processColor('blue'),
        position: 0,
      },
      {
        color: processColor('green'),
        position: 1.5,
      },
      {
        color: processColor('yellow'),
        position: 1.5,
      },
    ];
    const result = processBackgroundImage(input);
    const result1 = processBackgroundImage(
      `linear-gradient(red, blue -50%, green 150%, yellow)`,
    );
    expect(result[0].colorStops).toEqual(output);
    expect(result1[0].colorStops).toEqual(output);
  });

  it('should fix up stop positions #5', () => {
    const result = processBackgroundImage(
      'linear-gradient(red 40%  20%, blue 90%  120% , green)',
    );
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0.4},
      {color: processColor('red'), position: 0.4},
      {color: processColor('blue'), position: 0.9},
      {color: processColor('blue'), position: 1.2},
      {color: processColor('green'), position: 1.2},
    ]);
  });

  it('should fix up stop positions #6', () => {
    const result = processBackgroundImage(
      'linear-gradient(red 40%  20%, blue 90%  120% , green 200% 300%)',
    );
    expect(result[0].colorStops).toEqual([
      {color: processColor('red'), position: 0.4},
      {color: processColor('red'), position: 0.4},
      {color: processColor('blue'), position: 0.9},
      {color: processColor('blue'), position: 1.2},
      {color: processColor('green'), position: 2},
      {color: processColor('green'), position: 3},
    ]);
  });

  it('should return empty array for invalid multiple stop positions', () => {
    const result = processBackgroundImage([
      {
        type: 'linearGradient',
        colorStops: [
          {color: 'red', positions: ['40%  20']},
          {color: 'blue', positions: ['90%  120%']},
          {color: 'green', positions: ['200% 300%']},
        ],
      },
    ]);
    const result1 = processBackgroundImage(
      'linear-gradient(red 40%  20, blue 90%  120% , green 200% 300%)',
    );
    expect(result).toEqual([]);
    expect(result1).toEqual([]);
  });

  describe('iOS', () => {
    if (OS === 'ios') {
      it('should process iOS PlatformColor colors', () => {
        const result = processBackgroundImage([
          {
            type: 'linearGradient',
            colorStops: [
              {color: PlatformColorIOS('systemRedColor'), positions: ['0%']},
              {color: 'red', positions: ['100%']},
            ],
          },
        ]);
        expect(result[0].colorStops[0].color).toEqual({
          semantic: ['systemRedColor'],
        });
      });
      it('should process iOS Dynamic colors', () => {
        const result = processBackgroundImage([
          {
            type: 'linearGradient',
            colorStops: [
              {
                color: DynamicColorIOS({light: 'black', dark: 'white'}),
                positions: ['0%'],
              },
              {color: 'red', positions: ['100%']},
            ],
          },
        ]);
        expect(result[0].colorStops[0].color).toEqual({
          dynamic: {light: 0xff000000, dark: 0xffffffff},
        });
      });
    }
  });

  describe('Android', () => {
    if (OS === 'android') {
      it('should process Android PlatformColor colors', () => {
        const result = processBackgroundImage([
          {
            type: 'linearGradient',
            colorStops: [
              {
                color: PlatformColorAndroid('?attr/colorPrimary'),
                positions: ['0%'],
              },
              {color: 'red', positions: ['100%']},
            ],
          },
        ]);
        expect(result[0].colorStops[0].color).toEqual({
          resource_paths: ['?attr/colorPrimary'],
        });
      });
    }
  });
});
