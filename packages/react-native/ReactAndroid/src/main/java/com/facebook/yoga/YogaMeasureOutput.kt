/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

/** Helpers for building measure output value. */
public object YogaMeasureOutput {
  @JvmStatic
  public fun make(width: Float, height: Float): Long {
    val wBits = java.lang.Float.floatToRawIntBits(width)
    val hBits = java.lang.Float.floatToRawIntBits(height)
    return (wBits.toLong()) shl 32 or (hBits.toLong())
  }

  @JvmStatic
  public fun make(width: Int, height: Int): Long = make(width.toFloat(), height.toFloat())

  @JvmStatic
  public fun getWidth(measureOutput: Long): Float =
      java.lang.Float.intBitsToFloat((0xFFFFFFFFL and (measureOutput shr 32)).toInt())

  @JvmStatic
  public fun getHeight(measureOutput: Long): Float =
      java.lang.Float.intBitsToFloat((0xFFFFFFFFL and measureOutput).toInt())
}
