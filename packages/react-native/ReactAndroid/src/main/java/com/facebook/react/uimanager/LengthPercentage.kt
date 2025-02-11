/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.style.CornerRadii
import java.lang.NumberFormatException

public enum class LengthPercentageType {
  POINT,
  PERCENT,
}

public data class LengthPercentage(
    private val value: Float,
    public val type: LengthPercentageType,
) {
  public companion object {
    @JvmStatic
    public fun setFromDynamic(dynamic: Dynamic): LengthPercentage? {
      return when (dynamic.type) {
        ReadableType.Number -> {
          val value = dynamic.asDouble()
          if (value >= 0f) {
            LengthPercentage(value.toFloat(), LengthPercentageType.POINT)
          } else {
            null
          }
        }
        ReadableType.String -> {
          val s = dynamic.asString()
          if (s.endsWith("%")) {
            try {
              val value = s.substring(0, s.length - 1).toFloat()
              if (value >= 0f) {
                LengthPercentage(value, LengthPercentageType.PERCENT)
              } else {
                null
              }
            } catch (e: NumberFormatException) {
              FLog.w(ReactConstants.TAG, "Invalid percentage format: $s")
              null
            }
          } else {
            FLog.w(ReactConstants.TAG, "Invalid string value: $s")
            null
          }
        }
        else -> {
          FLog.w(ReactConstants.TAG, "Unsupported type for radius property: ${dynamic.type}")
          null
        }
      }
    }
  }

  public fun resolve(width: Float, height: Float): CornerRadii {
    if (type == LengthPercentageType.PERCENT) {
      return CornerRadii((value / 100) * width, (value / 100) * height)
    }

    return CornerRadii(value, value)
  }

  public fun resolve(referenceLength: Float): Float {
    if (type == LengthPercentageType.PERCENT) {
      return (value / 100) * referenceLength
    }

    return value
  }

  public constructor() : this(0f, LengthPercentageType.POINT)
}
