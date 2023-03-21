/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ProcessedColorValue} from './processColor';
import type {ColorValue} from './StyleSheet';

export opaque type NativeColorValue = {
  resource_paths?: Array<string>,
};

export const PlatformColor = (...names: Array<string>): ColorValue => {
  return {resource_paths: names};
};

export const normalizeColorObject = (
  color: NativeColorValue,
): ?ProcessedColorValue => {
  if ('resource_paths' in color) {
    return color;
  }
  return null;
};

export const processColorObject = (
  color: NativeColorValue,
): ?NativeColorValue => {
  return color;
};
