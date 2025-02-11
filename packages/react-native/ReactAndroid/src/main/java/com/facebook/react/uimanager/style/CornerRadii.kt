/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.uimanager.PixelUtil

public data class CornerRadii(
    val horizontal: Float = 0f,
    val vertical: Float = 0f,
) {
  public fun toPixelFromDIP(): CornerRadii {
    return CornerRadii(PixelUtil.toPixelFromDIP(horizontal), PixelUtil.toPixelFromDIP(vertical))
  }
}
