/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.util.LayoutDirection
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType

/** Represents the collection of possible border radius style properties. */
public enum class BorderRadiusProp {
  BORDER_TOP_LEFT_RADIUS,
  BORDER_TOP_RIGHT_RADIUS,
  BORDER_BOTTOM_RIGHT_RADIUS,
  BORDER_BOTTOM_LEFT_RADIUS,
  BORDER_TOP_START_RADIUS,
  BORDER_TOP_END_RADIUS,
  BORDER_BOTTOM_START_RADIUS,
  BORDER_BOTTOM_END_RADIUS,
  BORDER_END_END_RADIUS,
  BORDER_END_START_RADIUS,
  BORDER_START_END_RADIUS,
  BORDER_START_START_RADIUS,
  BORDER_RADIUS,
}

/** Represents all logical properties and shorthands for border radius. */
public data class BorderRadiusStyle(
    var uniform: LengthPercentage? = null,
    var topLeft: LengthPercentage? = null,
    var topRight: LengthPercentage? = null,
    var bottomLeft: LengthPercentage? = null,
    var bottomRight: LengthPercentage? = null,
    var topStart: LengthPercentage? = null,
    var topEnd: LengthPercentage? = null,
    var bottomStart: LengthPercentage? = null,
    var bottomEnd: LengthPercentage? = null,
    var startStart: LengthPercentage? = null,
    var startEnd: LengthPercentage? = null,
    var endStart: LengthPercentage? = null,
    var endEnd: LengthPercentage? = null
) {
  public constructor(properties: List<Pair<BorderRadiusProp, LengthPercentage>>) : this() {
    properties.forEach { (k, v) -> set(k, v) }
  }

  public fun set(property: BorderRadiusProp, value: LengthPercentage?) {
    when (property) {
      BorderRadiusProp.BORDER_RADIUS -> uniform = value
      BorderRadiusProp.BORDER_TOP_LEFT_RADIUS -> topLeft = value
      BorderRadiusProp.BORDER_TOP_RIGHT_RADIUS -> topRight = value
      BorderRadiusProp.BORDER_BOTTOM_LEFT_RADIUS -> bottomLeft = value
      BorderRadiusProp.BORDER_BOTTOM_RIGHT_RADIUS -> bottomRight = value
      BorderRadiusProp.BORDER_TOP_START_RADIUS -> topStart = value
      BorderRadiusProp.BORDER_TOP_END_RADIUS -> topEnd = value
      BorderRadiusProp.BORDER_BOTTOM_START_RADIUS -> bottomStart = value
      BorderRadiusProp.BORDER_BOTTOM_END_RADIUS -> bottomEnd = value
      BorderRadiusProp.BORDER_START_START_RADIUS -> startStart = value
      BorderRadiusProp.BORDER_START_END_RADIUS -> startEnd = value
      BorderRadiusProp.BORDER_END_START_RADIUS -> endStart = value
      BorderRadiusProp.BORDER_END_END_RADIUS -> endEnd = value
    }
  }

  public fun get(property: BorderRadiusProp): LengthPercentage? {
    return when (property) {
      BorderRadiusProp.BORDER_RADIUS -> uniform
      BorderRadiusProp.BORDER_TOP_LEFT_RADIUS -> topLeft
      BorderRadiusProp.BORDER_TOP_RIGHT_RADIUS -> topRight
      BorderRadiusProp.BORDER_BOTTOM_LEFT_RADIUS -> bottomLeft
      BorderRadiusProp.BORDER_BOTTOM_RIGHT_RADIUS -> bottomRight
      BorderRadiusProp.BORDER_TOP_START_RADIUS -> topStart
      BorderRadiusProp.BORDER_TOP_END_RADIUS -> topEnd
      BorderRadiusProp.BORDER_BOTTOM_START_RADIUS -> bottomStart
      BorderRadiusProp.BORDER_BOTTOM_END_RADIUS -> bottomEnd
      BorderRadiusProp.BORDER_START_START_RADIUS -> startStart
      BorderRadiusProp.BORDER_START_END_RADIUS -> startEnd
      BorderRadiusProp.BORDER_END_START_RADIUS -> endStart
      BorderRadiusProp.BORDER_END_END_RADIUS -> endEnd
    }
  }

  public fun hasRoundedBorders(): Boolean {
    return ((uniform?.value ?: 0f) > 0f) ||
        ((topLeft?.value ?: 0f) > 0f) ||
        ((topRight?.value ?: 0f) > 0f) ||
        ((bottomLeft?.value ?: 0f) > 0f) ||
        ((bottomRight?.value ?: 0f) > 0f) ||
        ((topStart?.value ?: 0f) > 0f) ||
        ((topEnd?.value ?: 0f) > 0f) ||
        ((bottomStart?.value ?: 0f) > 0f) ||
        ((bottomEnd?.value ?: 0f) > 0f) ||
        ((startStart?.value ?: 0f) > 0f) ||
        ((startEnd?.value ?: 0f) > 0f) ||
        ((endStart?.value ?: 0f) > 0f) ||
        ((endEnd?.value ?: 0f) > 0f)
  }

  private fun percentToPoint(width: Float, height: Float) {
    val borderRadiusVariables =
        listOf(
            uniform,
            topLeft,
            topRight,
            bottomLeft,
            bottomRight,
            topStart,
            topEnd,
            bottomStart,
            bottomEnd,
            startStart,
            startEnd,
            endStart,
            endEnd)
    for (variable in borderRadiusVariables) {
      variable?.let {
        if (it.unit == LengthPercentageType.PERCENT && width != 0f && height != 0f) {
          it.value = (it.value / 100) * Math.max(width, height)
          it.unit = LengthPercentageType.POINT
        }
      }
    }
  }

  public fun resolve(
      layoutDirection: Int,
      context: Context,
      width: Float,
      height: Float,
  ): ComputedBorderRadius {
    percentToPoint(width, height)

    val topLeft: Float =
        startStart?.value ?: topStart?.value ?: topLeft?.value ?: uniform?.value ?: 0f
    val topRight: Float =
        endStart?.value ?: topEnd?.value ?: topRight?.value ?: uniform?.value ?: 0f
    val bottomLeft: Float =
        startEnd?.value ?: bottomStart?.value ?: bottomLeft?.value ?: uniform?.value ?: 0f
    val bottomRight: Float =
        endEnd?.value ?: bottomEnd?.value ?: bottomRight?.value ?: uniform?.value ?: 0f

    return when (layoutDirection) {
      LayoutDirection.LTR ->
          ComputedBorderRadius(
              topLeft = topLeft,
              topRight = topRight,
              bottomLeft = bottomLeft,
              bottomRight = bottomRight,
          )
      LayoutDirection.RTL ->
          if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(context)) {
            ComputedBorderRadius(
                topLeft = topRight,
                topRight = topLeft,
                bottomLeft = bottomRight,
                bottomRight = bottomLeft,
            )
          } else {
            ComputedBorderRadius(
                topLeft = topRight,
                topRight = topLeft,
                bottomLeft = bottomRight,
                bottomRight = bottomLeft,
            )
          }
      else -> throw IllegalArgumentException("Expected resolved layout direction")
    }
  }
}
