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

/** The actual type of the opaque NativeColorValue on iOS platform */
type LocalNativeColorValue = {
  semantic?: Array<string>,
  dynamic?: {
    light: ?(ColorValue | ProcessedColorValue),
    dark: ?(ColorValue | ProcessedColorValue),
    highContrastLight?: ?(ColorValue | ProcessedColorValue),
    highContrastDark?: ?(ColorValue | ProcessedColorValue),
  },
  alpha?: number,
  prominence?: ColorProminence,
  contentHeadroom?: number,
};

/**
 * Creates a builder proxy that allows chaining methods while maintaining
 * the underlying color data object for native consumption.
 */
function createPlatformColorBuilder(
  data: LocalNativeColorValue,
): NativeColorValue {
  const handler = {
    get(
      target: LocalNativeColorValue,
      prop: string,
    ): mixed {
      // For builder method properties, return the value if already set,
      // otherwise return a builder function
      if (prop === 'alpha') {
        if ('alpha' in target) {
          return target.alpha;
        }
        return (value: number): NativeColorValue => {
          target.alpha = value;
          return new Proxy(target, handler);
        };
      }
      if (prop === 'prominence') {
        if ('prominence' in target) {
          return target.prominence;
        }
        return (value: ColorProminence): NativeColorValue => {
          target.prominence = value;
          return new Proxy(target, handler);
        };
      }
      if (prop === 'contentHeadroom') {
        if ('contentHeadroom' in target) {
          return target.contentHeadroom;
        }
        return (value: number): NativeColorValue => {
          target.contentHeadroom = value;
          return new Proxy(target, handler);
        };
      }
      // $FlowFixMe[incompatible-return]
      return target[prop];
    },
    has(target: LocalNativeColorValue, prop: string): boolean {
      return prop in target;
    },
    ownKeys(target: LocalNativeColorValue): Array<string> {
      return Object.keys(target);
    },
    getOwnPropertyDescriptor(
      target: LocalNativeColorValue,
      prop: string,
    ): ?{value: mixed, writable: boolean, enumerable: boolean, configurable: boolean} {
      return Object.getOwnPropertyDescriptor(target, prop);
    },
  };

  // $FlowExpectedError[incompatible-return] Proxy is compatible with NativeColorValue
  return new Proxy(data, handler);
}

export const PlatformColor = (...names: Array<string>): NativeColorValue => {
  const data: LocalNativeColorValue = {semantic: names};
  return createPlatformColorBuilder(data);
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
  const data: LocalNativeColorValue = {
    dynamic: {
      light: tuple.light,
      dark: tuple.dark,
      highContrastLight: tuple.highContrastLight,
      highContrastDark: tuple.highContrastDark,
    },
  };
  // $FlowExpectedError[incompatible-return] Proxy is compatible with ColorValue
  return createPlatformColorBuilder(data);
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
    if (color.alpha != null) {
      dynamicColor.alpha = color.alpha;
    }
    if (color.prominence != null) {
      dynamicColor.prominence = color.prominence;
    }
    if (color.contentHeadroom != null) {
      dynamicColor.contentHeadroom = color.contentHeadroom;
    }
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
    if (color.alpha != null) {
      dynamicColor.alpha = color.alpha;
    }
    if (color.prominence != null) {
      dynamicColor.prominence = color.prominence;
    }
    if (color.contentHeadroom != null) {
      dynamicColor.contentHeadroom = color.contentHeadroom;
    }
    return dynamicColor;
  }
  return color;
};

export const processColorObject: (
  color: NativeColorValue,
  /* $FlowExpectedError[incompatible-type]
   * LocalNativeColorValue is the actual type of the opaque NativeColorValue on iOS platform */
) => ?NativeColorValue = _processColorObject;
