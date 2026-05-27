/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public object YogaConstants {
  @JvmField public val UNDEFINED: Float = Float.NaN

  @JvmStatic public fun isUndefined(value: Float): Boolean = value.compareTo(UNDEFINED) == 0

  @JvmStatic public fun isUndefined(value: YogaValue): Boolean = value.unit == YogaUnit.UNDEFINED

  @JvmStatic public fun getUndefined(): Float = UNDEFINED
}
