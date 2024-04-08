/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.graphics.PixelFormat
import kotlin.math.roundToInt

/**
 * Simple utility class for manipulating colors, based on Fresco's DrawableUtils
 * (https://github.com/facebook/fresco). For a small helper like this, copying is simpler than
 * adding a dependency on com.facebook.fresco.drawee.
 */
public object ColorUtil {

  /**
   * Multiplies the color with the given alpha.
   *
   * @param color color to be multiplied
   * @param alpha value between 0 and 255
   * @return multiplied color
   */
  @JvmStatic
  public fun multiplyColorAlpha(color: Int, alpha: Int): Int {
    if (alpha == 255) {
      return color
    } else if (alpha == 0) {
      return color and 0x00FFFFFF
    }

    val scaledAlpha = alpha + (alpha shr 7) // make it 0..256
    val colorAlpha = color ushr 24
    val multipliedAlpha = (colorAlpha * scaledAlpha) shr 8
    return (multipliedAlpha shl 24) or (color and 0x00FFFFFF)
  }

  /**
   * Gets the opacity from a color. Inspired by Android ColorDrawable.
   *
   * @param color color to get opacity from
   * @return opacity expressed by one of PixelFormat constants
   */
  @JvmStatic
  public fun getOpacityFromColor(color: Int): Int {
    val colorAlpha = color ushr 24
    return when (colorAlpha) {
      255 -> PixelFormat.OPAQUE
      0 -> PixelFormat.TRANSPARENT
      else -> PixelFormat.TRANSLUCENT
    }
  }

  /**
   * Converts individual {r, g, b, a} channel values to a single integer representation of the color
   * as 0xAARRGGBB.
   *
   * @param r red channel value, [0, 255]
   * @param g green channel value, [0, 255]
   * @param b blue channel value, [0, 255]
   * @param a alpha channel value, [0, 1]
   * @return integer representation of the color as 0xAARRGGBB
   */
  @JvmStatic
  public fun normalize(r: Double, g: Double, b: Double, a: Double): Int {
    return (clamp255(a * 255) shl 24) or (clamp255(r) shl 16) or (clamp255(g) shl 8) or clamp255(b)
  }

  private fun clamp255(value: Double): Int = maxOf(0, minOf(255, value.roundToInt()))
}
