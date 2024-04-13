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
    var uniform: Float? = null,
    var topLeft: Float? = null,
    var topRight: Float? = null,
    var bottomLeft: Float? = null,
    var bottomRight: Float? = null,
    var topStart: Float? = null,
    var topEnd: Float? = null,
    var bottomStart: Float? = null,
    var bottomEnd: Float? = null,
    var startStart: Float? = null,
    var startEnd: Float? = null,
    var endStart: Float? = null,
    var endEnd: Float? = null
) {
  public constructor(properties: List<Pair<BorderRadiusProp, Float>>) : this() {
    properties.forEach { (k, v) -> set(k, v) }
  }

  public fun set(property: BorderRadiusProp, value: Float?) {
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

  public fun get(property: BorderRadiusProp): Float? {
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
    return ((uniform ?: 0f) > 0f) ||
        ((topLeft ?: 0f) > 0f) ||
        ((topRight ?: 0f) > 0f) ||
        ((bottomLeft ?: 0f) > 0f) ||
        ((bottomRight ?: 0f) > 0f) ||
        ((topStart ?: 0f) > 0f) ||
        ((topEnd ?: 0f) > 0f) ||
        ((bottomStart ?: 0f) > 0f) ||
        ((bottomEnd ?: 0f) > 0f) ||
        ((startStart ?: 0f) > 0f) ||
        ((startEnd ?: 0f) > 0f) ||
        ((endStart ?: 0f) > 0f) ||
        ((endEnd ?: 0f) > 0f)
  }

  public fun resolve(
      layoutDirection: Int,
      context: Context,
  ): ComputedBorderRadius {
    return when (layoutDirection) {
      LayoutDirection.LTR ->
          ComputedBorderRadius(
              topLeft = startStart ?: topStart ?: topLeft ?: uniform ?: 0f,
              topRight = endStart ?: topEnd ?: topRight ?: uniform ?: 0f,
              bottomLeft = startEnd ?: bottomStart ?: bottomLeft ?: uniform ?: 0f,
              bottomRight = endEnd ?: bottomEnd ?: bottomRight ?: uniform ?: 0f)
      LayoutDirection.RTL ->
          if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(context)) {
            ComputedBorderRadius(
                topLeft = endStart ?: topEnd ?: topRight ?: uniform ?: 0f,
                topRight = startStart ?: topStart ?: topLeft ?: uniform ?: 0f,
                bottomLeft = endEnd ?: bottomStart ?: bottomRight ?: uniform ?: 0f,
                bottomRight = startEnd ?: bottomEnd ?: bottomLeft ?: uniform ?: 0f)
          } else {
            ComputedBorderRadius(
                topLeft = endStart ?: topEnd ?: topLeft ?: uniform ?: 0f,
                topRight = startStart ?: topStart ?: topRight ?: uniform ?: 0f,
                bottomLeft = endEnd ?: bottomStart ?: bottomLeft ?: uniform ?: 0f,
                bottomRight = startEnd ?: bottomEnd ?: bottomRight ?: uniform ?: 0f)
          }
      else -> throw IllegalArgumentException("Expected resolved layout direction")
    }
  }
}
