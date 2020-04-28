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
import type {NativeOrDynamicColorType} from '../Color/NativeOrDynamicColorType'; // TODO(macOS ISS#2323203)

function processColorArray(
  colors: ?Array<string>,
): ?Array<?(number | NativeOrDynamicColorType)> {
  return colors == null ? null : colors.map(processColor);
}

module.exports = processColorArray;
