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
import type {ColorValue, NativeColorValue} from './StyleSheet';

/** The actual type of the opaque NativeColorValue on Android platform */
type LocalNativeColorValue = {
  resource_paths?: Array<string>,
};

export const PlatformColor = (...names: Array<string>): ColorValue => {
  /* $FlowExpectedError[incompatible-return]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on Android platform */
  return ({resource_paths: names}: LocalNativeColorValue);
};

export const normalizeColorObject = (
  color: NativeColorValue,
): ?ProcessedColorValue => {
  /* $FlowExpectedError[incompatible-cast]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on Android platform */
  if ('resource_paths' in (color: LocalNativeColorValue)) {
    return color;
  }
  return null;
};

export const processColorObject = (
  color: NativeColorValue,
): ?NativeColorValue => {
  return color;
};
