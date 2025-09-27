/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants

public enum class ImageResizeMethod {
  AUTO,
  RESIZE,
  SCALE,
  NONE;

  public companion object {
    @JvmStatic
    public fun parse(resizeMethod: String?): ImageResizeMethod {
      return when (resizeMethod) {
        null,
        "",
        "auto" -> ImageResizeMethod.AUTO
        "resize" -> ImageResizeMethod.RESIZE
        "scale" -> ImageResizeMethod.SCALE
        "none" -> ImageResizeMethod.NONE
        else -> {
          FLog.w(ReactConstants.TAG, "Invalid resize method: '$resizeMethod'")
          ImageResizeMethod.AUTO
        }
      }
    }
  }
}
