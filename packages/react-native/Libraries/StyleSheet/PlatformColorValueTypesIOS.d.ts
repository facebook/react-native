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

/**
 * Color prominence levels for iOS 18+.
 * Controls the visual prominence of a color in the interface.
 */
export type ColorProminence =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'quaternary';

type PlatformColorIOSOptions = {
  /**
   * The opacity to apply to the color (0.0 to 1.0)
   */
  alpha?: number | undefined;
  /**
   * The prominence level of the color (iOS 18+).
   * - primary: Full prominence (default)
   * - secondary: Reduced prominence
   * - tertiary: Further reduced prominence
   * - quaternary: Minimal prominence
   */
  prominence?: ColorProminence | undefined;
};

/**
 * Creates a platform color with the specified semantic color name(s) and optional modifiers.
 *
 * @param color The semantic color name or an array of fallback color names
 * @param options Options including alpha for opacity and prominence for iOS 18+
 * @platform ios
 *
 * @example
 * ```ts
 * // Using a single semantic color with 50% opacity
 * PlatformColorIOS('label', { alpha: 0.5 })
 *
 * // Using fallback colors with opacity
 * PlatformColorIOS(['systemBlue', 'blue'], { alpha: 0.8 })
 *
 * // Using prominence (iOS 18+)
 * PlatformColorIOS('label', { prominence: 'secondary' })
 * ```
 */
export function PlatformColorIOS(
  color: string | string[],
  options?: PlatformColorIOSOptions,
): OpaqueColorValue;
