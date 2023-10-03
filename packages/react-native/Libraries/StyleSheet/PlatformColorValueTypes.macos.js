/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// [macOS]
import type {ProcessedColorValue} from './processColor';
import type {ColorValue, NativeColorValue} from './StyleSheet';

/** The actual type of the opaque NativeColorValue on macOS platform */
type LocalNativeColorValue = {
  semantic?: Array<string>,
  dynamic?: {
    light: ?(ColorValue | ProcessedColorValue),
    dark: ?(ColorValue | ProcessedColorValue),
    highContrastLight?: ?(ColorValue | ProcessedColorValue),
    highContrastDark?: ?(ColorValue | ProcessedColorValue),
  },
  colorWithSystemEffect?: {
    baseColor: ?(ColorValue | ProcessedColorValue),
    systemEffect: SystemEffectMacOSPrivate,
  },
};

export const PlatformColor = (...names: Array<string>): ColorValue => {
  // $FlowExpectedError[incompatible-return] LocalNativeColorValue is the macOS LocalNativeColorValue type
  return ({semantic: names}: LocalNativeColorValue);
};

export type SystemEffectMacOSPrivate =
  | 'none'
  | 'pressed'
  | 'deepPressed'
  | 'disabled'
  | 'rollover';

export const ColorWithSystemEffectMacOSPrivate = (
  color: ColorValue,
  effect: SystemEffectMacOSPrivate,
): ColorValue => {
  return ({
    colorWithSystemEffect: {
      baseColor: color,
      systemEffect: effect,
    },
    /* $FlowExpectedError[incompatible-return]
     * LocalNativeColorValue is the actual type of the opaque NativeColorValue on macOS platform */
  }: LocalNativeColorValue);
};

export type DynamicColorMacOSTuplePrivate = {
  light: ColorValue,
  dark: ColorValue,
  highContrastLight?: ColorValue,
  highContrastDark?: ColorValue,
};

export const DynamicColorMacOSPrivate = (
  tuple: DynamicColorMacOSTuplePrivate,
): ColorValue => {
  return ({
    dynamic: {
      light: tuple.light,
      dark: tuple.dark,
      highContrastLight: tuple.highContrastLight,
      highContrastDark: tuple.highContrastDark,
    },
    /* $FlowExpectedError[incompatible-return]
     * LocalNativeColorValue is the actual type of the opaque NativeColorValue on macOS platform */
  }: LocalNativeColorValue);
};

const _normalizeColorObject = (
  color: LocalNativeColorValue,
): ?LocalNativeColorValue => {
  if ('semantic' in color) {
    // a macOS semantic color
    return color;
  } else if ('dynamic' in color && color.dynamic !== undefined) {
    const normalizeColor = require('./normalizeColor');

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
  } else if (
    'colorWithSystemEffect' in color &&
    color.colorWithSystemEffect != null
  ) {
    const normalizeColor = require('./normalizeColor');
    const colorWithSystemEffect = color.colorWithSystemEffect;
    const colorObject: LocalNativeColorValue = {
      colorWithSystemEffect: {
        // $FlowFixMe[incompatible-use]
        baseColor: normalizeColor(colorWithSystemEffect.baseColor),
        // $FlowFixMe[incompatible-use]
        systemEffect: colorWithSystemEffect.systemEffect,
      },
    };
    return colorObject;
  }
  return null;
};

export const normalizeColorObject: (
  color: NativeColorValue,
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on macOS platform */
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
  } else if (
    'colorWithSystemEffect' in color &&
    color.colorWithSystemEffect != null
  ) {
    const processColor = require('./processColor').default;
    const colorWithSystemEffect = color.colorWithSystemEffect;
    const colorObject: LocalNativeColorValue = {
      colorWithSystemEffect: {
        // $FlowFixMe[incompatible-use]
        baseColor: processColor(colorWithSystemEffect.baseColor),
        // $FlowFixMe[incompatible-use]
        systemEffect: colorWithSystemEffect.systemEffect,
      },
    };
    return colorObject;
  }
  return color;
};

export const processColorObject: (
  color: NativeColorValue,
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on iOS platform */
) => ?NativeColorValue = _processColorObject;
