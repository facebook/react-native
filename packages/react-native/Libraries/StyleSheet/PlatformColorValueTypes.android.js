/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ProcessedColorValue} from './processColor';
import type {NativeColorValue} from './StyleSheet';

export type ColorProminence =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'quaternary';

export type PlatformColorOptions = {
  name: string,
  alpha?: number,
  prominence?: ColorProminence,
  contentHeadroom?: number,
};

export type PlatformColorSpec = string | PlatformColorOptions;

/** The actual type of the opaque NativeColorValue on Android platform */
type LocalNativeColorValue = {
  resource_paths?: Array<string>,
};

/**
 * Extracts color name from a spec (string or options object).
 * On Android, only the name is used - modifiers like alpha/prominence are iOS-specific.
 */
function getColorName(spec: PlatformColorSpec): string {
  if (typeof spec === 'string') {
    return spec;
  }
  return spec.name;
}

export const PlatformColor = (
  ...specs: Array<PlatformColorSpec>
): NativeColorValue => {
  const names = specs.map(getColorName);
  // $FlowExpectedError[incompatible-return] LocalNativeColorValue is compatible with NativeColorValue
  return {resource_paths: names};
};

export const normalizeColorObject = (
  color: NativeColorValue,
): ?ProcessedColorValue => {
  /* $FlowExpectedError[incompatible-type]
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
