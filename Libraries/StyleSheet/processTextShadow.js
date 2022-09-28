/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue} from '../StyleSheet/StyleSheet';

const namedColors = [
  'transparent',
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'burntsienna',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
];

function processTextShadow(textShadow: string): {
  xOffset?: number,
  yOffset?: number,
  blurRadius?: number,
  color?: ColorValue,
} {
  const offsetRegex = '(?:[-+]?\\d+(?:\\.\\d+)?[a-z]*)';
  const valueSeparator = '\\s+';
  const twoOrThreeOffsetRegex = `(${offsetRegex}(?:${valueSeparator}${offsetRegex}){1,2})`;

  const hex8 = '#[0-9a-f]{8}';
  const hex6 = '#[0-9a-f]{6}';
  const hex3 = '#[0-9a-f]{3}';
  const hexColor = `(?:(?:${hex8}|${hex6}|${hex3}))\\b`;
  const colorFunction = '(?:(?:rgb|hsl)a?|hwb)(?:[^)]*\\))';
  const namedColor = namedColors.join('|');
  const colorRegex = `(${hexColor}|${colorFunction}|${namedColor})`;

  const numberWithoutUnitRegex = /[+-]?\d+(\.\d+)?/g;

  const shadowColorFirst = new RegExp(
    `${colorRegex}${valueSeparator}${twoOrThreeOffsetRegex}`,
    'gi',
  );
  const shadowOffsetFirst = new RegExp(
    `${twoOrThreeOffsetRegex}(?:${valueSeparator}${colorRegex})?`,
    'gi',
  );

  let match;
  let xOffset;
  let yOffset;
  let blurRadius;
  let color;
  let numbers;

  if ((match = shadowColorFirst.exec(textShadow))) {
    numbers = match[2];
    color = match[1];

    if (shadowColorFirst.exec(textShadow)) {
      console.warn(
        'Currently multiple shadows are not supported in React Native. Only the first shadow will be applied',
      );
    }
  } else if ((match = shadowOffsetFirst.exec(textShadow))) {
    numbers = match[1];
    color = match[2];
    if (shadowOffsetFirst.exec(textShadow)) {
      console.warn(
        'Currently multiple shadows are not supported in React Native. Only the first shadow will be applied',
      );
    }
  }
  [xOffset, yOffset, blurRadius] =
    numbers
      ?.trim()
      .split(' ')
      .map(number => {
        return Number(number.trim().match(numberWithoutUnitRegex)?.[0]);
      }) || [];

  return {
    xOffset: xOffset,
    yOffset: yOffset,
    blurRadius: blurRadius,
    color: color,
  };
}

module.exports = processTextShadow;
