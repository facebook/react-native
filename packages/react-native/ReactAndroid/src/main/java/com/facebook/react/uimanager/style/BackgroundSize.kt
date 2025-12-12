/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.LengthPercentage

internal class BackgroundSizeLengthPercentage(
    public val x: LengthPercentage?,
    public val y: LengthPercentage?,
) {
  public fun isXAuto(): Boolean = x == null

  public fun isYAuto(): Boolean = y == null

  public companion object {
    public fun parse(backgroundSizeMap: ReadableMap?): BackgroundSizeLengthPercentage? {
      if (backgroundSizeMap == null) return null

      val x =
          if (
              backgroundSizeMap.hasKey("x") && backgroundSizeMap.getType("x") != ReadableType.Null
          ) {
            when (backgroundSizeMap.getType("x")) {
              ReadableType.Number ->
                  LengthPercentage.setFromDynamic(backgroundSizeMap.getDynamic("x"))
              ReadableType.String -> {
                when (val xStr = backgroundSizeMap.getString("x")) {
                  "auto" -> null
                  else -> {
                    if (xStr != null && xStr.endsWith("%")) {
                      LengthPercentage.setFromDynamic(backgroundSizeMap.getDynamic(("x")))
                    } else {
                      null
                    }
                  }
                }
              }

              else -> null
            }
          } else null

      val y =
          if (
              backgroundSizeMap.hasKey("y") && backgroundSizeMap.getType("y") != ReadableType.Null
          ) {
            when (backgroundSizeMap.getType("y")) {
              ReadableType.Number ->
                  LengthPercentage.setFromDynamic(backgroundSizeMap.getDynamic("y"))
              ReadableType.String -> {
                val yStr = backgroundSizeMap.getString("y")
                when (yStr) {
                  "auto" -> null
                  else -> {
                    if (yStr != null && yStr.endsWith("%")) {
                      LengthPercentage.setFromDynamic(backgroundSizeMap.getDynamic("y"))
                    } else {
                      null
                    }
                  }
                }
              }

              else -> null
            }
          } else null

      return BackgroundSizeLengthPercentage(x, y)
    }
  }
}

internal sealed class BackgroundSize {
  public class LengthPercentageAuto(public val lengthPercentage: BackgroundSizeLengthPercentage) :
      BackgroundSize()

  public companion object {
    public fun parse(backgroundSizeValue: Dynamic?): BackgroundSize? {
      if (backgroundSizeValue == null) return null

      return when (backgroundSizeValue.type) {
        ReadableType.Map -> {
          val backgroundSizeValueMap = backgroundSizeValue.asMap() ?: return null
          val lengthPercentage = BackgroundSizeLengthPercentage.parse(backgroundSizeValueMap)
          if (lengthPercentage != null) {
            LengthPercentageAuto(lengthPercentage)
          } else {
            null
          }
        }
        else -> null
      }
    }
  }
}
