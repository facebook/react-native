/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public class YogaValue
public constructor(@JvmField public val value: Float, @JvmField public val unit: YogaUnit) {
  internal constructor(value: Float, unit: Int) : this(value, YogaUnit.fromInt(unit))

  override fun equals(other: Any?): Boolean {
    if (other is YogaValue) {
      val otherValue = other
      if (unit == otherValue.unit) {
        return unit == YogaUnit.UNDEFINED ||
            unit == YogaUnit.AUTO ||
            value.compareTo(otherValue.value) == 0
      }
    }
    return false
  }

  override fun hashCode(): Int = java.lang.Float.floatToIntBits(value) + unit.intValue()

  override fun toString(): String =
      when (unit) {
        YogaUnit.UNDEFINED -> "undefined"
        YogaUnit.POINT -> value.toString()
        YogaUnit.PERCENT -> "$value%"
        YogaUnit.AUTO -> "auto"
        else -> throw IllegalStateException()
      }

  public companion object {
    @JvmField
    public val UNDEFINED: YogaValue = YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

    @JvmField public val ZERO: YogaValue = YogaValue(0f, YogaUnit.POINT)

    @JvmField public val AUTO: YogaValue = YogaValue(YogaConstants.UNDEFINED, YogaUnit.AUTO)

    @JvmStatic
    public fun parse(s: String?): YogaValue? {
      if (s == null) {
        return null
      }

      if ("undefined" == s) {
        return UNDEFINED
      }

      if ("auto" == s) {
        return AUTO
      }

      if (s.endsWith("%")) {
        return YogaValue(s.substring(0, s.length - 1).toFloat(), YogaUnit.PERCENT)
      }

      return YogaValue(s.toFloat(), YogaUnit.POINT)
    }
  }
}
