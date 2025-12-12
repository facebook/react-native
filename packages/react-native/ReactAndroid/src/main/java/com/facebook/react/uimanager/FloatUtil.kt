/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import kotlin.math.abs

/**
 * Utility class for comparing floating-point numbers with epsilon-based equality.
 *
 * This class provides methods to compare float values while accounting for floating-point precision
 * issues. Direct equality comparison of floats can be unreliable due to rounding errors in
 * floating-point arithmetic. This utility uses an epsilon threshold to determine if two float
 * values are "close enough" to be considered equal.
 */
public object FloatUtil {

  private const val EPSILON = .00001f

  /**
   * Compares two float values for equality using an epsilon threshold.
   *
   * This method handles special cases:
   * - If both values are NaN, they are considered equal
   * - If only one value is NaN, they are not equal
   * - Otherwise, values are equal if their absolute difference is less than [EPSILON]
   *
   * @param f1 the first float value to compare
   * @param f2 the second float value to compare
   * @return `true` if the values are equal within the epsilon threshold, `false` otherwise
   */
  @JvmStatic
  public fun floatsEqual(f1: Float, f2: Float): Boolean {
    return if (f1.isNaN() || f2.isNaN()) {
      f1.isNaN() && f2.isNaN()
    } else abs(f2 - f1) < EPSILON
  }

  /**
   * Compares two nullable float values for equality using an epsilon threshold.
   *
   * This method handles null values:
   * - If both values are null, they are considered equal
   * - If only one value is null, they are not equal
   * - If both values are non-null, delegates to [floatsEqual] with non-null parameters
   *
   * @param f1 the first nullable float value to compare
   * @param f2 the second nullable float value to compare
   * @return `true` if the values are equal (both null or equal within epsilon), `false` otherwise
   */
  @JvmStatic
  public fun floatsEqual(f1: Float?, f2: Float?): Boolean {
    if (f1 == null) {
      return f2 == null
    } else if (f2 == null) {
      return false
    }

    return floatsEqual(f1, f2)
  }
}
