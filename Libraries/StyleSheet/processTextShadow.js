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

import {getColorRegExStrings} from '@react-native/normalize-color';

function processTextShadow(textShadow: string): {
  xOffset?: number,
  yOffset?: number,
  blurRadius?: number,
  color?: ColorValue,
} {
  const matchers = getMatchers();

  let match;
  let xOffset;
  let yOffset;
  let blurRadius;
  let color;
  let numbers;

  if ((match = matchers.shadowColorFirst.exec(textShadow))) {
    // Index is really 38 due to the use of many capturing groups.
    numbers = match[38];
    color = match[1];

    if (matchers.shadowColorFirst.exec(textShadow)) {
      console.warn(
        'Currently multiple shadows are not supported in React Native. Only the first shadow will be applied',
      );
    }
  } else if ((match = matchers.shadowOffsetFirst.exec(textShadow))) {
    numbers = match[1];
    color = match[2];
    if (matchers.shadowOffsetFirst.exec(textShadow)) {
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
        return Number(
          number.trim().match(matchers.numberWithoutUnitRegex)?.[0],
        );
      }) || [];

  return {
    xOffset: xOffset,
    yOffset: yOffset,
    blurRadius: blurRadius,
    color: color,
  };
}

let cachedMatchers;
function getMatchers() {
  if (!cachedMatchers) {
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
    const namedColor = '\\b[a-z]+\\b';
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
    cachedMatchers = {
      numberWithoutUnitRegex,
      shadowColorFirst,
      shadowOffsetFirst,
    };
  }

  return cachedMatchers;
}

module.exports = processTextShadow;
