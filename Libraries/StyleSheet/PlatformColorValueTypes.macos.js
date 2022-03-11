/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */
// [TODO(macOS GH#774)
'use strict';

import type {ColorValue} from './StyleSheet';
import type {ProcessedColorValue} from './processColor';

export opaque type NativeColorValue = {
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
  return {semantic: names};
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
  return {
    colorWithSystemEffect: {
      baseColor: color,
      systemEffect: effect,
    },
  };
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
  return {
    dynamic: {
      light: tuple.light,
      dark: tuple.dark,
      highContrastLight: tuple.highContrastLight,
      highContrastDark: tuple.highContrastDark,
    },
  };
};

export const normalizeColorObject = (
  color: NativeColorValue,
): ?ProcessedColorValue => {
  if ('semantic' in color) {
    // a macOS semantic color
    return color;
  } else if ('dynamic' in color && color.dynamic !== undefined) {
    const normalizeColor = require('./normalizeColor');

    // a dynamic, appearance aware color
    const dynamic = color.dynamic;
    const dynamicColor: NativeColorValue = {
      dynamic: {
        light: normalizeColor(dynamic.light),
        dark: normalizeColor(dynamic.dark),
        highContrastLight: normalizeColor(dynamic.highContrastLight),
        highContrastDark: normalizeColor(dynamic.highContrastDark),
      },
    };
    return dynamicColor;
  } else if (
    'colorWithSystemEffect' in color &&
    color.colorWithSystemEffect != null
  ) {
    const processColor = require('./processColor');
    const colorWithSystemEffect = color.colorWithSystemEffect;
    const colorObject: NativeColorValue = {
      colorWithSystemEffect: {
        baseColor: processColor(colorWithSystemEffect.baseColor),
        systemEffect: colorWithSystemEffect.systemEffect,
      },
    };
    return colorObject;
  }
  return null;
};

export const processColorObject = (
  color: NativeColorValue,
): ?NativeColorValue => {
  if ('dynamic' in color && color.dynamic != null) {
    const processColor = require('./processColor');
    const dynamic = color.dynamic;
    const dynamicColor: NativeColorValue = {
      dynamic: {
        light: processColor(dynamic.light),
        dark: processColor(dynamic.dark),
        highContrastLight: processColor(dynamic.highContrastLight),
        highContrastDark: processColor(dynamic.highContrastDark),
      },
    };
    return dynamicColor;
  } else if (
    'colorWithSystemEffect' in color &&
    color.colorWithSystemEffect != null
  ) {
    const processColor = require('./processColor');
    const colorWithSystemEffect = color.colorWithSystemEffect;
    const colorObject: NativeColorValue = {
      colorWithSystemEffect: {
        baseColor: processColor(colorWithSystemEffect.baseColor),
        systemEffect: colorWithSystemEffect.systemEffect,
      },
    };
    return colorObject;
  }
  return color;
};
// ]TODO(macOS GH#774)
