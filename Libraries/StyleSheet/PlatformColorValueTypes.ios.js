/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

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
};

export const PlatformColor = (...names: Array<string>): ColorValue => {
  return {semantic: names};
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
    // an ios semantic color
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
  }
  return color;
};
