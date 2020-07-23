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

const processColor = require('./processColor');

import type {ColorValue} from './StyleSheet';
import type {ProcessedColorValue} from './processColor';

function processColorArray(
  colors: ?Array<ColorValue>,
): ?Array<?ProcessedColorValue> {
  return colors == null ? null : colors.map(processColor);
}

module.exports = processColorArray;
