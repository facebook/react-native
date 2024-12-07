/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

public enum class BorderStyle {
  SOLID,
  DASHED,
  DOTTED;

  public companion object {
    @JvmStatic
    public fun fromString(borderStyle: String): BorderStyle? {
      return when (borderStyle.lowercase()) {
        "solid" -> SOLID
        "dashed" -> DASHED
        "dotted" -> DOTTED
        else -> null
      }
    }
  }
}
