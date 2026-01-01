/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue} from './StyleSheet';

export type DynamicColorIOSTuple = {
  light: ColorValue,
  dark: ColorValue,
  highContrastLight?: ColorValue,
  highContrastDark?: ColorValue,
};

export type ColorProminence =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'quaternary';

export type PlatformColorIOSOptions = {
  alpha?: number,
  prominence?: ColorProminence,
};

/**
 * Specify color to display depending on the current system appearance settings
 *
 * @param tuple Colors you want to use for "light mode" and "dark mode"
 * @platform ios
 */
export const DynamicColorIOS = (tuple: DynamicColorIOSTuple): ColorValue => {
  throw new Error('DynamicColorIOS is not available on this platform.');
};

/**
 * Creates a platform color with the specified semantic color name(s) and optional opacity.
 *
 * @param color The semantic color name or an array of fallback color names
 * @param options Options including alpha for opacity
 * @platform ios
 */
export const PlatformColorIOS = (
  color: string | Array<string>,
  options?: PlatformColorIOSOptions,
): ColorValue => {
  throw new Error('PlatformColorIOS is not available on this platform.');
};
