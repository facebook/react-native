/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

/** Represents the collection of possible computed border radius style properties. */
public enum class ComputedBorderRadiusProp {
  COMPUTED_BORDER_TOP_LEFT_RADIUS,
  COMPUTED_BORDER_TOP_RIGHT_RADIUS,
  COMPUTED_BORDER_BOTTOM_RIGHT_RADIUS,
  COMPUTED_BORDER_BOTTOM_LEFT_RADIUS,
}

/** Physical edge lengths (in DIPs) for a border-radius. */
public data class ComputedBorderRadius(
    val topLeft: CornerRadii,
    val topRight: CornerRadii,
    val bottomLeft: CornerRadii,
    val bottomRight: CornerRadii,
) {
  public fun hasRoundedBorders(): Boolean {
    return topLeft.horizontal > 0f ||
        topLeft.vertical > 0f ||
        topRight.horizontal > 0f ||
        topRight.vertical > 0f ||
        bottomLeft.horizontal > 0f ||
        bottomLeft.vertical > 0f ||
        bottomRight.horizontal > 0f
  }

  public fun isUniform(): Boolean {
    return topLeft == topRight && topLeft == bottomLeft && topLeft == bottomRight
  }

  public fun get(property: ComputedBorderRadiusProp): CornerRadii {
    return when (property) {
      ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_LEFT_RADIUS -> topLeft
      ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_RIGHT_RADIUS -> topRight
      ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_LEFT_RADIUS -> bottomLeft
      ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_RIGHT_RADIUS -> bottomRight
    }
  }

  public constructor() :
      this(CornerRadii(0f, 0f), CornerRadii(0f, 0f), CornerRadii(0f, 0f), CornerRadii(0f, 0f))
}
