/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

internal enum class BackgroundRepeatKeyword {
  Repeat,
  Space,
  Round,
  NoRepeat,
}

internal class BackgroundRepeat(
    public val x: BackgroundRepeatKeyword,
    public val y: BackgroundRepeatKeyword,
) {
  public companion object {
    public fun parse(backgroundRepeatMap: ReadableMap?): BackgroundRepeat? {
      if (backgroundRepeatMap == null) return null

      val x = parseRepeatStyle(backgroundRepeatMap, "x") ?: BackgroundRepeatKeyword.Repeat
      val y = parseRepeatStyle(backgroundRepeatMap, "y") ?: BackgroundRepeatKeyword.Repeat

      return BackgroundRepeat(x, y)
    }

    private fun parseRepeatStyle(map: ReadableMap, key: String): BackgroundRepeatKeyword? {
      if (!map.hasKey(key) || map.getType(key) != ReadableType.String) return null

      return when (map.getString(key)) {
        "repeat" -> BackgroundRepeatKeyword.Repeat
        "space" -> BackgroundRepeatKeyword.Space
        "round" -> BackgroundRepeatKeyword.Round
        "no-repeat" -> BackgroundRepeatKeyword.NoRepeat
        else -> null
      }
    }
  }
}
