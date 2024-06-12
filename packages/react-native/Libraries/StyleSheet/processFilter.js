/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format strict-local
 * @flow
 * @oncall react-native
 */

'use strict';

import type {ColorValue} from './StyleSheet';

import processColor from './processColor';

export type FilterPrimitive =
  | {brightness: number | string}
  | {blur: number | string}
  | {contrast: number | string}
  | {grayscale: number | string}
  | {hueRotate: number | string}
  | {invert: number | string}
  | {opacity: number | string}
  | {saturate: number | string}
  | {sepia: number | string}
  | {dropShadow: DropShadowPrimitive | string};

// Move this to StyleSheetTypes
export type DropShadowPrimitive = {
  offsetX: number | string,
  offsetY: number | string,
  standardDeviation?: number | string,
  color?: ColorValue | number,
  inset?: boolean,
};

export default function processFilter(
  filter: $ReadOnlyArray<FilterPrimitive> | string,
): $ReadOnlyArray<FilterPrimitive | DropShadowPrimitive> {
  let result: Array<FilterPrimitive | DropShadowPrimitive> = [];
  if (typeof filter === 'string') {
    // matches on functions with args like "brightness(1.5)"
    const regex = /(\w+)\(([^)]+)\)/g;
    let matches;

    while ((matches = regex.exec(filter))) {
      if (matches[1] === 'dropShadow') {
        const dropShadow = parseDropShadow(matches[2]);
        if (dropShadow != null) {
          result.push({dropShadow: dropShadow});
        } else {
          return [];
        }
      } else {
        const amount = _getFilterAmount(matches[1], matches[2]);

        if (amount != null) {
          const filterPrimitive = {};
          // $FlowFixMe The key will be the correct one but flow can't see that.
          filterPrimitive[matches[1]] = amount;
          // $FlowFixMe The key will be the correct one but flow can't see that.
          result.push(filterPrimitive);
        } else {
          // If any primitive is invalid then apply none of the filters. This is how
          // web works and makes it clear that something is wrong becuase no
          // graphical effects are happening.
          return [];
        }
      }
    }
  } else {
    for (const filterPrimitive of filter) {
      const [filterName, filterValue] = Object.entries(filterPrimitive)[0];
      if (filterName === 'dropShadow') {
        // $FlowFixMe
        const dropShadow = parseDropShadow(filterValue);
        if (dropShadow == null) {
          return [];
        }
        result.push({dropShadow: dropShadow});
      } else {
        const amount = _getFilterAmount(filterName, filterValue);

        if (amount != null) {
          const resultObject = {};
          // $FlowFixMe
          resultObject[filterName] = amount;
          // $FlowFixMe
          result.push(resultObject);
        } else {
          // If any primitive is invalid then apply none of the filters. This is how
          // web works and makes it clear that something is wrong becuase no
          // graphical effects are happening.
          return [];
        }
      }
    }
  }

  return result;
}

function _getFilterAmount(filterName: string, filterArgs: mixed): ?number {
  let filterArgAsNumber: number;
  let unit: string;
  if (typeof filterArgs === 'string') {
    // matches on args with units like "1.5 5% -80deg"
    const argsWithUnitsRegex = new RegExp(/([+-]?\d*(\.\d+)?)([a-zA-Z%]+)?/g);
    const match = argsWithUnitsRegex.exec(filterArgs);

    if (!match || isNaN(Number(match[1]))) {
      return undefined;
    }

    filterArgAsNumber = Number(match[1]);
    unit = match[3];
  } else if (typeof filterArgs === 'number') {
    filterArgAsNumber = filterArgs;
  } else {
    return undefined;
  }

  switch (filterName) {
    // Hue rotate takes some angle that can have a unit and can be
    // negative. Additionally, 0 with no unit is allowed.
    case 'hueRotate':
      if (filterArgAsNumber === 0) {
        return 0;
      }
      if (unit !== 'deg' && unit !== 'rad') {
        return undefined;
      }
      return unit === 'rad'
        ? (180 * filterArgAsNumber) / Math.PI
        : filterArgAsNumber;
    // blur takes any positive CSS length that is not a percent. In RN
    // we currently only have DIPs, so we are not parsing units here.
    case 'blur':
      if ((unit && unit !== 'px') || filterArgAsNumber < 0) {
        return undefined;
      }
      return filterArgAsNumber;
    // All other filters except take a non negative number or percentage. There
    // are no units associated with this value and percentage numbers map 1-to-1
    // to a non-percentage number (e.g. 50% == 0.5).
    case 'brightness':
    case 'contrast':
    case 'grayscale':
    case 'invert':
    case 'opacity':
    case 'saturate':
    case 'sepia':
      if ((unit && unit !== '%' && unit !== 'px') || filterArgAsNumber < 0) {
        return undefined;
      }
      if (unit === '%') {
        filterArgAsNumber /= 100;
      }
      return filterArgAsNumber;
    default:
      return undefined;
  }
}

function parseDropShadow(
  rawDropShadow: string | DropShadowPrimitive,
): ?DropShadowPrimitive {
  const dropShadow =
    typeof rawDropShadow === 'string'
      ? parseDropShadowString(rawDropShadow)
      : rawDropShadow;

  let value;
  for (const arg in dropShadow) {
    switch (arg) {
      case 'offsetX':
        value =
          typeof dropShadow.offsetX === 'string'
            ? parseLength(dropShadow.offsetX)
            : dropShadow.offsetX;
        if (value == null) {
          return null;
        }
        dropShadow.offsetX = value;
        break;
      case 'offsetY':
        value =
          typeof dropShadow.offsetY === 'string'
            ? parseLength(dropShadow.offsetY)
            : dropShadow.offsetY;
        if (value == null) {
          return null;
        }
        dropShadow.offsetY = value;
        break;
      case 'standardDeviation':
        value =
          typeof dropShadow.standardDeviation === 'string'
            ? parseLength(dropShadow.standardDeviation)
            : dropShadow.standardDeviation;
        if (value == null) {
          return null;
        }
        dropShadow.standardDeviation = value;
        break;
      case 'color':
        if (dropShadow.color == null) {
          const color = processColor(dropShadow.color);
          if (color == null) {
            return null;
          }
          dropShadow.color = color;
        }

        break;
      case 'inset':
        dropShadow.inset = dropShadow.inset;
    }
  }
  return dropShadow;
}

function parseDropShadowString(rawDropShadow: string): ?DropShadowPrimitive {
  const dropShadow: DropShadowPrimitive = {
    offsetX: 0,
    offsetY: 0,
  };
  let offsetX: number | string;
  let offsetY: number | string;
  let lengthCount = 0;
  let keywordDetectedAfterLength = false;

  // split on all whitespaces
  for (const arg of rawDropShadow.split(/\s+/)) {
    const processedColor = processColor(arg);
    if (processedColor != null) {
      if (dropShadow.color != null) {
        return null;
      }
      if (offsetX != null) {
        keywordDetectedAfterLength = true;
      }
      dropShadow.color = processedColor;
      continue;
    }

    if (arg === 'inset') {
      if (dropShadow.inset != null) {
        return null;
      }
      if (offsetX != null) {
        keywordDetectedAfterLength = true;
      }
      dropShadow.inset = true;
      continue;
    }

    switch (lengthCount) {
      case 0:
        offsetX = arg;
        lengthCount++;
        break;
      case 1:
        if (keywordDetectedAfterLength) {
          return null;
        }
        offsetY = arg;
        lengthCount++;
        break;
      case 2:
        if (keywordDetectedAfterLength) {
          return null;
        }
        dropShadow.standardDeviation = arg;
        lengthCount++;
        break;
      default:
        return null;
    }
  }
  if (offsetX == null || offsetY == null) {
    return null;
  }

  dropShadow.offsetX = offsetX;
  dropShadow.offsetY = offsetY;
  return dropShadow;
}

function parseLength(length: string): ?number {
  // matches on args with units like "1.5 5% -80deg"
  const argsWithUnitsRegex = /([+-]?\d*(\.\d+)?)([a-za-z%]+)?/g;
  const match = argsWithUnitsRegex.exec(length);

  if (!match || Number.isNaN(match[1])) {
    return null;
  }

  if (match[3] != null && match[3] !== 'px') {
    return null;
  }

  return Number(match[1]);
}
