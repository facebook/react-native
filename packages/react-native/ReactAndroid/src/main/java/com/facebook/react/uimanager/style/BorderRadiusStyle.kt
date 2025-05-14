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
internal data class BorderRadiusStyle(
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
  constructor(properties: List<Pair<BorderRadiusProp, LengthPercentage>>) : this() {
    properties.forEach { (k, v) -> set(k, v) }
  }

  fun set(property: BorderRadiusProp, value: LengthPercentage?) {
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

  fun get(property: BorderRadiusProp): LengthPercentage? {
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

  fun hasRoundedBorders(): Boolean {
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

  fun resolve(
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
                    (endEnd ?: bottomEnd ?: bottomRight ?: uniform)?.resolve(width, height)
                        ?: zeroRadii,
                bottomRight =
                    (startEnd ?: bottomStart ?: bottomLeft ?: uniform)?.resolve(width, height)
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
    val leftEdgeRadii = topLeft.vertical + bottomLeft.vertical
    val topEdgeRadii = topLeft.horizontal + topRight.horizontal
    val rightEdgeRadii = topRight.vertical + bottomRight.vertical
    val bottomEdgeRadii = bottomLeft.horizontal + bottomRight.horizontal

    val leftEdgeRadiiScale = if (leftEdgeRadii > 0) minOf(height / leftEdgeRadii, 1f) else 0f
    val topEdgeRadiiScale = if (topEdgeRadii > 0) minOf(width / topEdgeRadii, 1f) else 0f
    val rightEdgeRadiiScale = if (rightEdgeRadii > 0) minOf(height / rightEdgeRadii, 1f) else 0f
    val bottomEdgeRadiiScale = if (bottomEdgeRadii > 0) minOf(width / bottomEdgeRadii, 1f) else 0f

    return ComputedBorderRadius(
        topLeft =
            CornerRadii(
                topLeft.horizontal * minOf(topEdgeRadiiScale, leftEdgeRadiiScale),
                topLeft.vertical * minOf(topEdgeRadiiScale, leftEdgeRadiiScale)),
        topRight =
            CornerRadii(
                topRight.horizontal * minOf(rightEdgeRadiiScale, topEdgeRadiiScale),
                topRight.vertical * minOf(rightEdgeRadiiScale, topEdgeRadiiScale)),
        bottomLeft =
            CornerRadii(
                bottomLeft.horizontal * minOf(bottomEdgeRadiiScale, leftEdgeRadiiScale),
                bottomLeft.vertical * minOf(bottomEdgeRadiiScale, leftEdgeRadiiScale)),
        bottomRight =
            CornerRadii(
                bottomRight.horizontal * minOf(bottomEdgeRadiiScale, rightEdgeRadiiScale),
                bottomRight.vertical * minOf(bottomEdgeRadiiScale, rightEdgeRadiiScale)))
  }
}
