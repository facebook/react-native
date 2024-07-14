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

/** Phsysical edge lengths (in DIPs) for a border-radius. */
public data class ComputedBorderRadius(
    val topLeft: Float,
    val topRight: Float,
    val bottomLeft: Float,
    val bottomRight: Float,
) {
  public fun hasRoundedBorders(): Boolean {
    return topLeft > 0f || topRight > 0f || bottomLeft > 0f || bottomRight > 0f
  }

  public fun get(property: ComputedBorderRadiusProp): Float {
    return when (property) {
      ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_LEFT_RADIUS -> topLeft
      ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_RIGHT_RADIUS -> topRight
      ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_LEFT_RADIUS -> bottomLeft
      ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_RIGHT_RADIUS -> bottomRight
    }
  }

  public constructor() : this(0f, 0f, 0f, 0f)
}
