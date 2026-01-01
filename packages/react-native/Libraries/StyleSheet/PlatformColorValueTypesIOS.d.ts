/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {ColorValue, OpaqueColorValue} from './StyleSheet';

type DynamicColorIOSTuple = {
  light: ColorValue;
  dark: ColorValue;
  highContrastLight?: ColorValue | undefined;
  highContrastDark?: ColorValue | undefined;
};

/**
 * Specify color to display depending on the current system appearance settings
 *
 * @param tuple Colors you want to use for "light mode" and "dark mode"
 * @platform ios
 */
export function DynamicColorIOS(tuple: DynamicColorIOSTuple): OpaqueColorValue;

type PlatformColorIOSOptions = {
  /**
   * The opacity to apply to the color (0.0 to 1.0)
   */
  alpha?: number | undefined;
};

/**
 * Creates a platform color with the specified semantic color name(s) and optional opacity.
 *
 * @param color The semantic color name or an array of fallback color names
 * @param options Options including alpha for opacity
 * @platform ios
 *
 * @example
 * ```ts
 * // Using a single semantic color with 50% opacity
 * PlatformColorIOS('label', { alpha: 0.5 })
 *
 * // Using fallback colors with opacity
 * PlatformColorIOS(['systemBlue', 'blue'], { alpha: 0.8 })
 * ```
 */
export function PlatformColorIOS(
  color: string | string[],
  options?: PlatformColorIOSOptions,
): OpaqueColorValue;
