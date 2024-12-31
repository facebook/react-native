/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react-native
 */

import type {ProcessedColorValue} from './processColor';
import type {BoxShadowValue} from './StyleSheetTypes';

import processColor from './processColor';

export type ParsedBoxShadow = {
  offsetX: number,
  offsetY: number,
  color?: ProcessedColorValue,
  blurRadius?: number,
  spreadDistance?: number,
  inset?: boolean,
};

export default function processBoxShadow(
  rawBoxShadows: ?($ReadOnlyArray<BoxShadowValue> | string),
): Array<ParsedBoxShadow> {
  const result: Array<ParsedBoxShadow> = [];
  if (rawBoxShadows == null) {
    return result;
  }

  const boxShadowList =
    typeof rawBoxShadows === 'string'
      ? parseBoxShadowString(rawBoxShadows.replace(/\n/g, ' '))
      : rawBoxShadows;

  for (const rawBoxShadow of boxShadowList) {
    const parsedBoxShadow: ParsedBoxShadow = {
      offsetX: 0,
      offsetY: 0,
    };

    let value;
    for (const arg in rawBoxShadow) {
      switch (arg) {
        case 'offsetX':
          value =
            typeof rawBoxShadow.offsetX === 'string'
              ? parseLength(rawBoxShadow.offsetX)
              : rawBoxShadow.offsetX;
          if (value == null) {
            return [];
          }

          parsedBoxShadow.offsetX = value;
          break;
        case 'offsetY':
          value =
            typeof rawBoxShadow.offsetY === 'string'
              ? parseLength(rawBoxShadow.offsetY)
              : rawBoxShadow.offsetY;
          if (value == null) {
            return [];
          }

          parsedBoxShadow.offsetY = value;
          break;
        case 'spreadDistance':
          value =
            typeof rawBoxShadow.spreadDistance === 'string'
              ? parseLength(rawBoxShadow.spreadDistance)
              : rawBoxShadow.spreadDistance;
          if (value == null) {
            return [];
          }

          parsedBoxShadow.spreadDistance = value;
          break;
        case 'blurRadius':
          value =
            typeof rawBoxShadow.blurRadius === 'string'
              ? parseLength(rawBoxShadow.blurRadius)
              : rawBoxShadow.blurRadius;
          if (value == null || value < 0) {
            return [];
          }

          parsedBoxShadow.blurRadius = value;
          break;
        case 'color':
          const color = processColor(rawBoxShadow.color);
          if (color == null) {
            return [];
          }

          parsedBoxShadow.color = color;
          break;
        case 'inset':
          parsedBoxShadow.inset = rawBoxShadow.inset;
      }
    }
    result.push(parsedBoxShadow);
  }
  return result;
}

function parseBoxShadowString(rawBoxShadows: string): Array<BoxShadowValue> {
  let result: Array<BoxShadowValue> = [];

  for (const rawBoxShadow of rawBoxShadows
    .split(/,(?![^()]*\))/) // split by comma that is not in parenthesis
    .map(bS => bS.trim())
    .filter(bS => bS !== '')) {
    const boxShadow: BoxShadowValue = {
      offsetX: 0,
      offsetY: 0,
    };
    let offsetX: number | string;
    let offsetY: number | string;
    let keywordDetectedAfterLength = false;

    let lengthCount = 0;

    // split rawBoxShadow string by all whitespaces that are not in parenthesis
    const args = rawBoxShadow.split(/\s+(?![^(]*\))/);
    for (const arg of args) {
      const processedColor = processColor(arg);
      if (processedColor != null) {
        if (boxShadow.color != null) {
          return [];
        }
        if (offsetX != null) {
          keywordDetectedAfterLength = true;
        }
        boxShadow.color = arg;
        continue;
      }

      if (arg === 'inset') {
        if (boxShadow.inset != null) {
          return [];
        }
        if (offsetX != null) {
          keywordDetectedAfterLength = true;
        }
        boxShadow.inset = true;
        continue;
      }

      switch (lengthCount) {
        case 0:
          offsetX = arg;
          lengthCount++;
          break;
        case 1:
          if (keywordDetectedAfterLength) {
            return [];
          }
          offsetY = arg;
          lengthCount++;
          break;
        case 2:
          if (keywordDetectedAfterLength) {
            return [];
          }
          boxShadow.blurRadius = arg;
          lengthCount++;
          break;
        case 3:
          if (keywordDetectedAfterLength) {
            return [];
          }
          boxShadow.spreadDistance = arg;
          lengthCount++;
          break;
        default:
          return [];
      }
    }

    if (offsetX == null || offsetY == null) {
      return [];
    }

    boxShadow.offsetX = offsetX;
    boxShadow.offsetY = offsetY;

    result.push(boxShadow);
  }
  return result;
}

function parseLength(length: string): ?number {
  // matches on args with units like "1.5 5% -80deg"
  const argsWithUnitsRegex = /([+-]?\d*(\.\d+)?)([\w\W]+)?/g;
  const match = argsWithUnitsRegex.exec(length);

  if (!match || Number.isNaN(match[1])) {
    return null;
  }

  if (match[3] != null && match[3] !== 'px') {
    return null;
  }

  return Number(match[1]);
}
