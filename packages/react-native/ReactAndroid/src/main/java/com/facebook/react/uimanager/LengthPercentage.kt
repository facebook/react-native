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
import com.facebook.yoga.YogaConstants
import java.lang.NumberFormatException

public enum class LengthPercentageType {
  UNDEFINED,
  POINT,
  PERCENT,
}

public class LengthPercentage(
    public var value: Float = YogaConstants.UNDEFINED,
    public var unit: LengthPercentageType = LengthPercentageType.UNDEFINED,
) {
  public constructor() : this(YogaConstants.UNDEFINED, LengthPercentageType.UNDEFINED)

  public fun setFromDynamic(dynamic: Dynamic) {
    when (dynamic.getType()) {
      ReadableType.Number -> {
        unit = LengthPercentageType.POINT
        value = PixelUtil.toPixelFromDIP(dynamic.asDouble())
      }
      ReadableType.String -> {
        val s: String = dynamic.asString()
        if (s.endsWith("%")) {
          unit = LengthPercentageType.PERCENT
          try {
            value = s.substring(0, s.length - 1).toFloat()
          } catch (e: NumberFormatException) {
            unit = LengthPercentageType.UNDEFINED
            value = YogaConstants.UNDEFINED
            FLog.w(ReactConstants.TAG, "Invalid percentage format: $s")
          }
        } else {
          FLog.w(ReactConstants.TAG, "Invalid string value: $s")
          unit = LengthPercentageType.UNDEFINED
          value = YogaConstants.UNDEFINED
        }
      }
      else -> {
        unit = LengthPercentageType.UNDEFINED
        value = YogaConstants.UNDEFINED
        FLog.w(ReactConstants.TAG, "Unsupported type for radius property: ${dynamic.getType()}")
      }
    }
  }
}
