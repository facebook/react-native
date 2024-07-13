/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle

internal fun getShadowBorderRadii(
    spread: Float,
    backgroundBorderRadii: BorderRadiusStyle,
    width: Float,
    height: Float,
): BorderRadiusStyle {
  val adjustedBorderRadii = BorderRadiusStyle()
  val borderRadiusProps = BorderRadiusProp.values()

  borderRadiusProps.forEach { borderRadiusProp ->
    val borderRadius = backgroundBorderRadii.get(borderRadiusProp)
    adjustedBorderRadii.set(
        borderRadiusProp,
        if (borderRadius == null) null
        else adjustedBorderRadius(spread, borderRadius, width, height))
  }

  return adjustedBorderRadii
}

// See https://drafts.csswg.org/css-backgrounds/#shadow-shape
private fun adjustedBorderRadius(
    spread: Float,
    backgroundBorderRadius: LengthPercentage?,
    width: Float,
    height: Float,
): LengthPercentage? {
  if (backgroundBorderRadius == null) {
    return null
  }
  var adjustment = spread
  val backgroundBorderRadiusValue = backgroundBorderRadius.resolve(width, height)

  if (backgroundBorderRadiusValue < Math.abs(spread)) {
    val r = backgroundBorderRadiusValue / Math.abs(spread)
    val p = Math.pow(r - 1.0, 3.0)
    adjustment *= 1.0f + p.toFloat()
  }

  return LengthPercentage(backgroundBorderRadiusValue + adjustment, LengthPercentageType.POINT)
}
