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

/** Represents the collection of possible border radius style properties. */
public enum class BorderRadiusProp {
  BORDER_RADIUS,
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
    return uniform != null ||
        topLeft != null ||
        topRight != null ||
        bottomLeft != null ||
        bottomRight != null ||
        topStart != null ||
        topEnd != null ||
        bottomStart != null ||
        bottomEnd != null ||
        startStart != null ||
        startEnd != null ||
        endStart != null ||
        endEnd != null
  }

  public fun resolve(
      layoutDirection: Int,
      context: Context,
      width: Float,
      height: Float,
  ): ComputedBorderRadius {
    val zeroRadii = CornerRadii(0f, 0f)

    return when (layoutDirection) {
      LayoutDirection.LTR ->
          ensureNoOverlap(
              topLeft =
                  (startStart ?: topStart ?: topLeft ?: uniform)?.resolve(width, height)
                      ?: zeroRadii,
              topRight =
                  (endStart ?: topEnd ?: topRight ?: uniform)?.resolve(width, height) ?: zeroRadii,
              bottomLeft =
                  (startEnd ?: bottomStart ?: bottomLeft ?: uniform)?.resolve(width, height)
                      ?: zeroRadii,
              bottomRight =
                  (endEnd ?: bottomEnd ?: bottomRight ?: uniform)?.resolve(width, height)
                      ?: zeroRadii,
              width = width,
              height = height,
          )
      LayoutDirection.RTL ->
          if (I18nUtil.instance.doLeftAndRightSwapInRTL(context)) {
            ensureNoOverlap(
                topLeft =
                    (endStart ?: topEnd ?: topRight ?: uniform)?.resolve(width, height)
                        ?: zeroRadii,
                topRight =
                    (startStart ?: topStart ?: topLeft ?: uniform)?.resolve(width, height)
                        ?: zeroRadii,
                bottomLeft =
                    (endEnd ?: bottomStart ?: bottomRight ?: uniform)?.resolve(width, height)
                        ?: zeroRadii,
                bottomRight =
                    (startEnd ?: bottomEnd ?: bottomLeft ?: uniform)?.resolve(width, height)
                        ?: zeroRadii,
                width = width,
                height = height,
            )
          } else {
            ensureNoOverlap(
                topLeft =
                    (endStart ?: topEnd ?: topLeft ?: uniform)?.resolve(width, height) ?: zeroRadii,
                topRight =
                    (startStart ?: topStart ?: topRight ?: uniform)?.resolve(width, height)
                        ?: zeroRadii,
                bottomLeft =
                    (endEnd ?: bottomStart ?: bottomLeft ?: uniform)?.resolve(width, height)
                        ?: zeroRadii,
                bottomRight =
                    (startEnd ?: bottomEnd ?: bottomRight ?: uniform)?.resolve(width, height)
                        ?: zeroRadii,
                width = width,
                height = height,
            )
          }
      else -> throw IllegalArgumentException("Expected?.resolved layout direction")
    }
  }

  /**
   * "Corner curves must not overlap: When the sum of any two adjacent border radii exceeds the size
   * of the border box, UAs must proportionally reduce the used values of all border radii until
   * none of them overlap." Source: https://www.w3.org/TR/css-backgrounds-3/#corner-overlap
   */
  private fun ensureNoOverlap(
      topLeft: CornerRadii,
      topRight: CornerRadii,
      bottomLeft: CornerRadii,
      bottomRight: CornerRadii,
      width: Float,
      height: Float
  ): ComputedBorderRadius {
    val leftInset = topLeft.horizontal + bottomLeft.horizontal
    val topInset = topLeft.vertical + topRight.vertical
    val rightInset = topRight.horizontal + bottomRight.horizontal
    val bottomInset = bottomLeft.vertical + bottomRight.vertical

    val leftInsetScale = if (leftInset > 0) minOf(1.0f, height / leftInset) else 0f
    val topInsetScale = if (topInset > 0) minOf(1.0f, width / topInset) else 0f
    val rightInsetScale = if (rightInset > 0) minOf(1.0f, height / rightInset) else 0f
    val bottomInsetScale = if (bottomInset > 0) minOf(1.0f, width / bottomInset) else 0f

    return ComputedBorderRadius(
        topLeft =
            CornerRadii(
                topLeft.horizontal * minOf(topInsetScale, leftInsetScale),
                topLeft.vertical * minOf(topInsetScale, leftInsetScale)),
        topRight =
            CornerRadii(
                topRight.horizontal * minOf(topInsetScale, rightInsetScale),
                topRight.vertical * minOf(topInsetScale, rightInsetScale)),
        bottomLeft =
            CornerRadii(
                bottomLeft.horizontal * minOf(bottomInsetScale, leftInsetScale),
                bottomLeft.vertical * minOf(bottomInsetScale, leftInsetScale)),
        bottomRight =
            CornerRadii(
                bottomRight.horizontal * minOf(bottomInsetScale, rightInsetScale),
                bottomRight.vertical * minOf(bottomInsetScale, rightInsetScale)),
    )
  }
}
