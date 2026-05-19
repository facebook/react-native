/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.util.TypedValue
import kotlin.math.min

/** Android dp to pixel manipulation */
public object PixelUtil {
  /** Convert from DIP to PX */
  @JvmStatic
  public fun toPixelFromDIP(value: Float): Float {
    if (value.isNaN()) {
      return Float.NaN
    }

    return TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP,
        value,
        DisplayMetricsHolder.getScreenDisplayMetrics(),
    )
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
    if (value.isNaN()) {
      return Float.NaN
    }

    val displayMetrics = DisplayMetricsHolder.getScreenDisplayMetrics()
    val scaledValue = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, value, displayMetrics)

    if (maxFontScale >= 1) {
      return min(scaledValue, value * displayMetrics.density * maxFontScale)
    }

    return scaledValue
  }

  /** Convert from SP to PX */
  @JvmStatic
  public fun toPixelFromSP(value: Double): Float {
    return toPixelFromSP(value.toFloat())
  }

  /** Convert from PX to DP */
  @JvmStatic
  public fun toDIPFromPixel(value: Float): Float {
    if (value.isNaN()) {
      return Float.NaN
    }

    return value / DisplayMetricsHolder.getScreenDisplayMetrics().density
  }

  /** @return [Float] that represents the density of the display metrics for device screen. */
  @JvmStatic
  public fun getDisplayMetricDensity(): Float =
      DisplayMetricsHolder.getScreenDisplayMetrics().density

  /* Kotlin extensions */
  public fun Int.dpToPx(): Float = toPixelFromDIP(this.toFloat())

  public fun Long.dpToPx(): Float = toPixelFromDIP(this.toFloat())

  public fun Float.dpToPx(): Float = toPixelFromDIP(this)

  public fun Double.dpToPx(): Float = toPixelFromDIP(this.toFloat())

  public fun Int.pxToDp(): Float = toDIPFromPixel(this.toFloat())

  public fun Long.pxToDp(): Float = toDIPFromPixel(this.toFloat())

  public fun Float.pxToDp(): Float = toDIPFromPixel(this)

  public fun Double.pxToDp(): Float = toDIPFromPixel(this.toFloat())
}
