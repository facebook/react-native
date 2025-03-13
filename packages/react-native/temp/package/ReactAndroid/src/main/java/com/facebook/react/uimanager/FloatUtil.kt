/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import kotlin.math.abs

public object FloatUtil {
  private const val EPSILON = .00001f

  @JvmStatic
  public fun floatsEqual(f1: Float, f2: Float): Boolean {
    return if (java.lang.Float.isNaN(f1) || java.lang.Float.isNaN(f2)) {
      java.lang.Float.isNaN(f1) && java.lang.Float.isNaN(f2)
    } else abs(f2 - f1) < EPSILON
  }

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
