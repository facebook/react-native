/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import kotlin.math.roundToInt

/**
 * Simple utility class for manipulating colors, based on Fresco's DrawableUtils
 * (https://github.com/facebook/fresco). For a small helper like this, copying is simpler than
 * adding a dependency on com.facebook.fresco.drawee.
 */
public object ColorUtil {

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
