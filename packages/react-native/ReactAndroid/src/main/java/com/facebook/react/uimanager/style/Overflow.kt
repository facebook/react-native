/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

internal enum class Overflow {
  VISIBLE,
  HIDDEN,
  SCROLL;

  companion object {
    @JvmStatic
    fun fromString(overflow: String): Overflow? {
      return when (overflow.lowercase()) {
        "visible" -> VISIBLE
        "hidden" -> HIDDEN
        "scroll" -> SCROLL
        else -> null
      }
    }
  }
}
