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
import type {ColorValue, NativeColorValue} from './StyleSheet';

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

/** The actual type of the opaque NativeColorValue on iOS platform */
type LocalNativeColorValue = {
  semantic?: Array<PlatformColorOptions>,
  dynamic?: {
    light: ?(ColorValue | ProcessedColorValue),
    dark: ?(ColorValue | ProcessedColorValue),
    highContrastLight?: ?(ColorValue | ProcessedColorValue),
    highContrastDark?: ?(ColorValue | ProcessedColorValue),
  },
};

/**
 * Normalizes a color spec (string or options object) to options object format.
 */
function normalizeColorSpec(spec: PlatformColorSpec): PlatformColorOptions {
  if (typeof spec === 'string') {
    return {name: spec};
  }
  return spec;
}

export const PlatformColor = (
  ...specs: Array<PlatformColorSpec>
): NativeColorValue => {
  const normalizedSpecs = specs.map(normalizeColorSpec);
  // $FlowExpectedError[incompatible-return] LocalNativeColorValue is compatible with NativeColorValue
  return {semantic: normalizedSpecs};
};

export type DynamicColorIOSTuplePrivate = {
  light: ColorValue,
  dark: ColorValue,
  highContrastLight?: ColorValue,
  highContrastDark?: ColorValue,
};

export const DynamicColorIOSPrivate = (
  tuple: DynamicColorIOSTuplePrivate,
): ColorValue => {
  // $FlowExpectedError[incompatible-return] LocalNativeColorValue is compatible with ColorValue
  return {
    dynamic: {
      light: tuple.light,
      dark: tuple.dark,
      highContrastLight: tuple.highContrastLight,
      highContrastDark: tuple.highContrastDark,
    },
  };
};

const _normalizeColorObject = (
  color: LocalNativeColorValue,
): ?LocalNativeColorValue => {
  if ('semantic' in color) {
    // an ios semantic color
    return color;
  } else if ('dynamic' in color && color.dynamic !== undefined) {
    const normalizeColor = require('./normalizeColor').default;

    // a dynamic, appearance aware color
    const dynamic = color.dynamic;
    const dynamicColor: LocalNativeColorValue = {
      dynamic: {
        // $FlowFixMe[incompatible-use]
        light: normalizeColor(dynamic.light),
        // $FlowFixMe[incompatible-use]
        dark: normalizeColor(dynamic.dark),
        // $FlowFixMe[incompatible-use]
        highContrastLight: normalizeColor(dynamic.highContrastLight),
        // $FlowFixMe[incompatible-use]
        highContrastDark: normalizeColor(dynamic.highContrastDark),
      },
    };
    return dynamicColor;
  }
  return null;
};

export const normalizeColorObject: (
  color: NativeColorValue,
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on iOS platform */
) => ?ProcessedColorValue = _normalizeColorObject;

const _processColorObject = (
  color: LocalNativeColorValue,
): ?LocalNativeColorValue => {
  if ('dynamic' in color && color.dynamic != null) {
    const processColor = require('./processColor').default;
    const dynamic = color.dynamic;
    const dynamicColor: LocalNativeColorValue = {
      dynamic: {
        // $FlowFixMe[incompatible-use]
        light: processColor(dynamic.light),
        // $FlowFixMe[incompatible-use]
        dark: processColor(dynamic.dark),
        // $FlowFixMe[incompatible-use]
        highContrastLight: processColor(dynamic.highContrastLight),
        // $FlowFixMe[incompatible-use]
        highContrastDark: processColor(dynamic.highContrastDark),
      },
    };
    return dynamicColor;
  }
  return color;
};

export const processColorObject: (
  color: NativeColorValue,
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on iOS platform */
) => ?NativeColorValue = _processColorObject;
