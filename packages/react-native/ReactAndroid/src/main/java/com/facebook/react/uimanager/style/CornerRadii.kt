/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.PixelUtil

/** Represents the resolved horizontal and vertical radii of the ellipse representing a corner. */
public data class CornerRadii(
    val horizontal: Float = 0f,
    val vertical: Float = 0f,
) {
  public constructor(
      length: LengthPercentage,
      referenceWidth: Float,
      referenceHeight: Float
  ) : this(horizontal = length.resolve(referenceWidth), vertical = length.resolve(referenceHeight))

  public fun toPixelFromDIP(): CornerRadii {
    return CornerRadii(PixelUtil.toPixelFromDIP(horizontal), PixelUtil.toPixelFromDIP(vertical))
  }
}
