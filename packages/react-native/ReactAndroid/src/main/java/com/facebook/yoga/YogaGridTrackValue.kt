/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

/**
 * Represents a grid track value for use with grid-template-rows/columns.
 */
public class YogaGridTrackValue private constructor(
    public val type: Type,
    public val value: Float,
    public val minValue: YogaGridTrackValue?,
    public val maxValue: YogaGridTrackValue?
) {
  public enum class Type {
    AUTO,
    POINTS,
    PERCENT,
    FR,
    MINMAX
  }

  private constructor(type: Type, value: Float) : this(type, value, null, null)

  private constructor(min: YogaGridTrackValue, max: YogaGridTrackValue) : this(Type.MINMAX, 0f, min, max)

  public companion object {
    @JvmStatic
    public fun auto(): YogaGridTrackValue = YogaGridTrackValue(Type.AUTO, 0f)

    @JvmStatic
    public fun points(points: Float): YogaGridTrackValue = YogaGridTrackValue(Type.POINTS, points)

    @JvmStatic
    public fun percent(percent: Float): YogaGridTrackValue = YogaGridTrackValue(Type.PERCENT, percent)

    @JvmStatic
    public fun fr(fr: Float): YogaGridTrackValue = YogaGridTrackValue(Type.FR, fr)

    @JvmStatic
    public fun minMax(min: YogaGridTrackValue, max: YogaGridTrackValue): YogaGridTrackValue =
        YogaGridTrackValue(min, max)
  }
}
