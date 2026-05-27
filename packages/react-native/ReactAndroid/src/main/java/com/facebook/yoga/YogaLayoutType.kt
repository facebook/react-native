/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public enum class YogaLayoutType(public val intValue: Int) {
  LAYOUT(0),
  MEASURE(1),
  CACHED_LAYOUT(2),
  CACHED_MEASURE(3);

  public companion object {
    @JvmStatic
    public fun fromInt(value: Int): YogaLayoutType =
        when (value) {
          0 -> LAYOUT
          1 -> MEASURE
          2 -> CACHED_LAYOUT
          3 -> CACHED_MEASURE
          else -> throw IllegalArgumentException("Unknown enum value: $value")
        }
  }
}
