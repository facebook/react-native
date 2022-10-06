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

import {namedColors, getColorRegExStrings} from '@react-native/normalize-color';

function processTextShadow(textShadow: string): {
  xOffset?: number,
  yOffset?: number,
  blurRadius?: number,
  color?: ColorValue,
} {
  const offsetRegex = '(?:[-+]?\\d+(?:\\.\\d+)?[a-z]*)';
  const valueSeparator = '\\s+';
  const twoOrThreeOffsetRegex = `(${offsetRegex}(?:${valueSeparator}${offsetRegex}){1,2})`;

  const colorRegexStrings = getColorRegExStrings();
  const hex8 = colorRegexStrings.hex8;
  const hex6 = colorRegexStrings.hex6;
  const hex4 = colorRegexStrings.hex4;
  const hex3 = colorRegexStrings.hex3;
  const hexColor = `(?:(?:${hex8}|${hex6}|${hex3}|${hex4}))\\b`;
  const colorFunction = `(?:${colorRegexStrings.rgb}|${colorRegexStrings.rgba}|${colorRegexStrings.hsl}|${colorRegexStrings.hsla}|${colorRegexStrings.hwb})`;
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
    numbers = match[38];
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
