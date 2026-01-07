/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {OpaqueColorValue} from './StyleSheet';

/**
 * Color prominence levels for iOS 18+.
 * Controls the visual prominence of a color in the interface.
 */
export type ColorProminence =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'quaternary';

/**
 * A platform color value with chainable builder methods.
 * The builder methods allow setting iOS-specific color modifiers.
 * On Android and other platforms, these methods are no-ops for cross-platform compatibility.
 */
export interface PlatformColorValue extends OpaqueColorValue {
  /**
   * Sets the alpha (opacity) of the color.
   * @param value The opacity value from 0.0 (transparent) to 1.0 (opaque)
   * @platform ios
   *
   * @example
   * ```ts
   * PlatformColor('systemBlue').alpha(0.5)
   * ```
   */
  alpha(value: number): PlatformColorValue;

  /**
   * Sets the prominence level of the color (iOS 18+).
   * @param value The prominence level
   * @platform ios
   *
   * @example
   * ```ts
   * PlatformColor('label').prominence('secondary')
   * ```
   */
  prominence(value: ColorProminence): PlatformColorValue;

  /**
   * Sets the content headroom for HDR colors (iOS 26+).
   * Specifies how bright the color should appear relative to SDR peak white.
   * A value of 1.0 means standard SDR brightness, values greater than 1.0
   * enable HDR brightness on supported displays.
   * @param value The headroom value (typically 1.0 to 2.0+)
   * @platform ios
   *
   * @example
   * ```ts
   * PlatformColor('systemRed').contentHeadroom(1.5)
   * ```
   */
  contentHeadroom(value: number): PlatformColorValue;
}

/**
 * Select native platform color with optional chainable modifiers.
 * The color must match the string that exists on the native platform.
 *
 * @see https://reactnative.dev/docs/platformcolor#example
 *
 * @example
 * ```ts
 * // Basic usage
 * PlatformColor('systemBlue')
 *
 * // With alpha (iOS)
 * PlatformColor('systemBlue').alpha(0.5)
 *
 * // With prominence (iOS 18+)
 * PlatformColor('label').prominence('secondary')
 *
 * // Chained modifiers (iOS)
 * PlatformColor('systemRed').alpha(0.8).prominence('tertiary')
 *
 * // With fallback colors
 * PlatformColor('customColor', 'systemBlue')
 * ```
 */
export function PlatformColor(...colors: string[]): PlatformColorValue;
