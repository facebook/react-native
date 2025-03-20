/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.common.internal.Objects
import com.facebook.react.uimanager.PixelUtil

public class CornerRadii(
    public val horizontal: Float = 0f,
    public val vertical: Float = 0f,
) {
  public fun toPixelFromDIP(): CornerRadii {
    return CornerRadii(PixelUtil.toPixelFromDIP(horizontal), PixelUtil.toPixelFromDIP(vertical))
  }

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }
    if (javaClass != other?.javaClass) {
      return false
    }
    other as CornerRadii
    if (horizontal != other.horizontal) {
      return false
    }
    if (vertical != other.vertical) {
      return false
    }
    return true
  }

  override fun hashCode(): Int = Objects.hashCode(horizontal, vertical)
}
