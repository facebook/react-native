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

type AndroidColorSpec = {
  name: string,
  alpha?: number,
};

/** The actual type of the opaque NativeColorValue on Android platform */
type LocalNativeColorValue = {
  resource_paths?: Array<AndroidColorSpec>,
};

/**
 * Normalizes a color spec (string or options object) to Android color spec format.
 * On Android, only name and alpha are supported - prominence/contentHeadroom are iOS-specific.
 */
function normalizeColorSpec(spec: PlatformColorSpec): AndroidColorSpec {
  if (typeof spec === 'string') {
    return {name: spec};
  }
  const result: AndroidColorSpec = {name: spec.name};
  if (spec.alpha != null) {
    result.alpha = spec.alpha;
  }
  return result;
}

export const PlatformColor = (
  ...specs: Array<PlatformColorSpec>
): NativeColorValue => {
  const normalizedSpecs = specs.map(normalizeColorSpec);
  // $FlowExpectedError[incompatible-return] LocalNativeColorValue is compatible with NativeColorValue
  return {resource_paths: normalizedSpecs};
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
