/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ColorValue} from './StyleSheet';
import processColor, {type ProcessedColorValue} from './processColor';

const TRANSPARENT = 0; // rgba(0, 0, 0, 0)

function processColorArray(
  colors: ?$ReadOnlyArray<ColorValue>,
): ?$ReadOnlyArray<ProcessedColorValue> {
  return colors == null ? null : colors.map(processColorElement);
}

function processColorElement(color: ColorValue): ProcessedColorValue {
  const value = processColor(color);
  // For invalid colors, fallback to transparent.
  if (value == null) {
    console.error('Invalid value in color array:', color);
    return TRANSPARENT;
  }
  return value;
}

module.exports = processColorArray;
