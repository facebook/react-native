/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {PixelRatio} from 'react-native';

type BoxSize = {
  +inlineSize: number,
  +blockSize: number,
};

/**
 * Rounds a layout value to the nearest device pixel to avoid fractional pixel
 * rounding errors that can cause spurious resize callbacks.
 *
 * Without this fix, floating-point imprecision in layout values (e.g.,
 * 100.00000001 vs 100.0) could cause the observer to report a size change
 * when the rendered size hasn't actually changed on screen.
 *
 * The rounding is performed at device-pixel granularity so that the reported
 * size matches what is actually rendered on the display.
 */
export function roundToDevicePixel(value: number): number {
  if (value == null || !Number.isFinite(value)) {
    return 0;
  }

  const scale = PixelRatio.get();
  return Math.round(value * scale) / scale;
}

/**
 * Computes the content-box size for a given element width and height.
 *
 * In React Native, elements do not have CSS padding or border in the
 * traditional web sense — the layout dimensions from Yoga already
 * represent the content area. This helper applies the fractional pixel
 * rounding fix and returns the content-box dimensions.
 */
export function computeContentBoxSize(
  width: number,
  height: number,
): BoxSize {
  return {
    inlineSize: roundToDevicePixel(width),
    blockSize: roundToDevicePixel(height),
  };
}

/**
 * Computes the border-box size for a given element width and height.
 *
 * In React Native, Yoga layout dimensions include padding and border,
 * so the border-box size is equivalent to the raw layout dimensions
 * (after rounding).
 */
export function computeBorderBoxSize(
  width: number,
  height: number,
): BoxSize {
  return {
    inlineSize: roundToDevicePixel(width),
    blockSize: roundToDevicePixel(height),
  };
}

/**
 * Computes the device-pixel-content-box size for a given element.
 *
 * This returns the content dimensions in actual device pixels rather
 * than density-independent pixels (DIPs). Useful for canvas rendering
 * or any scenario requiring exact pixel-level dimensions.
 *
 * Null-check: If width or height is null/undefined (e.g., for a
 * disconnected element), returns zero dimensions to prevent crashes.
 */
export function computeDevicePixelContentBoxSize(
  width: number,
  height: number,
): BoxSize {
  if (width == null || height == null) {
    return {
      inlineSize: 0,
      blockSize: 0,
    };
  }

  const scale = PixelRatio.get();
  return {
    inlineSize: Math.round(width * scale),
    blockSize: Math.round(height * scale),
  };
}
