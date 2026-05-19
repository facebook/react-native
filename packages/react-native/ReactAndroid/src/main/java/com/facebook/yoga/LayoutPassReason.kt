/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public enum class LayoutPassReason(public val intValue: Int) {
  INITIAL(0),
  ABS_LAYOUT(1),
  STRETCH(2),
  MULTILINE_STRETCH(3),
  FLEX_LAYOUT(4),
  MEASURE(5),
  ABS_MEASURE(6),
  FLEX_MEASURE(7);

  public companion object {
    @JvmStatic
    public fun fromInt(value: Int): LayoutPassReason =
        when (value) {
          0 -> INITIAL
          1 -> ABS_LAYOUT
          2 -> STRETCH
          3 -> MULTILINE_STRETCH
          4 -> FLEX_LAYOUT
          5 -> MEASURE
          6 -> ABS_MEASURE
          7 -> FLEX_MEASURE
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
  }
}
