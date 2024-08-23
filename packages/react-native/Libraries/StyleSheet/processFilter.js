/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

export type FilterPrimitive =
  | {brightness: number | string}
  | {blur: number | string}
  | {contrast: number | string}
  | {grayscale: number | string}
  | {hueRotate: number | string}
  | {invert: number | string}
  | {opacity: number | string}
  | {saturate: number | string}
  | {sepia: number | string};

export default function processFilter(
  filter: $ReadOnlyArray<FilterPrimitive> | string,
): $ReadOnlyArray<FilterPrimitive> {
  let result: Array<FilterPrimitive> = [];
  if (typeof filter === 'string') {
    // matches on functions with args like "brightness(1.5)"
    const regex = new RegExp(/(\w+)\(([^)]+)\)/g);
    let matches;

    while ((matches = regex.exec(filter))) {
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
  } else {
    for (const filterPrimitive of filter) {
      const [filterName, filterValue] = Object.entries(filterPrimitive)[0];
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
