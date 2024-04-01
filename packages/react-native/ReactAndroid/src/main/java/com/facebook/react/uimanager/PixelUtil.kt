/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.util.TypedValue

/** Android dp to pixel manipulation */
public object PixelUtil {
  /** Convert from DIP to PX */
  @JvmStatic
  public fun toPixelFromDIP(value: Float): Float {
    return TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, value, DisplayMetricsHolder.getWindowDisplayMetrics())
  }

  /** Convert from DIP to PX */
  @JvmStatic
  public fun toPixelFromDIP(value: Double): Float {
    return toPixelFromDIP(value.toFloat())
  }

  /** Convert from SP to PX */
  @JvmOverloads
  @JvmStatic
  public fun toPixelFromSP(value: Float, maxFontScale: Float = Float.NaN): Float {
    val displayMetrics = DisplayMetricsHolder.getWindowDisplayMetrics()
    var scaledDensity = displayMetrics.scaledDensity
    val currentFontScale = scaledDensity / displayMetrics.density
    if (maxFontScale >= 1 && maxFontScale < currentFontScale) {
      scaledDensity = displayMetrics.density * maxFontScale
    }
    return value * scaledDensity
  }

  /** Convert from SP to PX */
  @JvmStatic
  public fun toPixelFromSP(value: Double): Float {
    return toPixelFromSP(value.toFloat())
  }

  /** Convert from PX to DP */
  @JvmStatic
  public fun toDIPFromPixel(value: Float): Float {
    return value / DisplayMetricsHolder.getWindowDisplayMetrics().density
  }

  /** @return [float] that represents the density of the display metrics for device screen. */
  @JvmStatic
  public fun getDisplayMetricDensity(): Float =
      DisplayMetricsHolder.getWindowDisplayMetrics().density
}
