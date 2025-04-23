/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import android.graphics.Shader.TileMode
import com.facebook.common.logging.FLog
import com.facebook.drawee.drawable.ScalingUtils
import com.facebook.react.common.ReactConstants

/** Converts JS resize modes into Android-specific scale type. */
public object ImageResizeMode {
  private const val RESIZE_MODE_CONTAIN = "contain"
  private const val RESIZE_MODE_COVER = "cover"
  private const val RESIZE_MODE_STRETCH = "stretch"
  private const val RESIZE_MODE_CENTER = "center"
  private const val RESIZE_MODE_REPEAT = "repeat"
  private const val RESIZE_MODE_NONE = "none"

  /** Converts JS resize modes into `ScalingUtils.ScaleType`. See `ImageResizeMode.js`. */
  @JvmStatic
  public fun toScaleType(resizeModeValue: String?): ScalingUtils.ScaleType {
    when (resizeModeValue) {
      RESIZE_MODE_CONTAIN -> return ScalingUtils.ScaleType.FIT_CENTER
      RESIZE_MODE_COVER -> return ScalingUtils.ScaleType.CENTER_CROP
      RESIZE_MODE_STRETCH -> return ScalingUtils.ScaleType.FIT_XY
      RESIZE_MODE_CENTER -> return ScalingUtils.ScaleType.CENTER_INSIDE
      // Handled via a combination of ScaleType and TileMode
      RESIZE_MODE_REPEAT -> return ScaleTypeStartInside.INSTANCE
      RESIZE_MODE_NONE -> return ScaleTypeStartInside.INSTANCE
    }

    if (resizeModeValue != null) {
      FLog.w(ReactConstants.TAG, "Invalid resize mode: '$resizeModeValue'")
    }
    // Use the default. Never use null.
    return defaultValue()
  }

  /** Converts JS resize modes into `Shader.TileMode`. See `ImageResizeMode.js`. */
  @JvmStatic
  public fun toTileMode(resizeModeValue: String?): TileMode {
    if (RESIZE_MODE_CONTAIN == resizeModeValue ||
        RESIZE_MODE_COVER == resizeModeValue ||
        RESIZE_MODE_STRETCH == resizeModeValue ||
        RESIZE_MODE_CENTER == resizeModeValue ||
        RESIZE_MODE_NONE == resizeModeValue) {
      return TileMode.CLAMP
    }
    if (RESIZE_MODE_REPEAT == resizeModeValue) {
      // Handled via a combination of ScaleType and TileMode
      return TileMode.REPEAT
    }
    if (resizeModeValue != null) {
      FLog.w(ReactConstants.TAG, "Invalid resize mode: '$resizeModeValue'")
    }
    // Use the default. Never use null.
    return defaultTileMode()
  }

  /** This is the default as per web and iOS. We want to be consistent across platforms. */
  @JvmStatic public fun defaultValue(): ScalingUtils.ScaleType = ScalingUtils.ScaleType.CENTER_CROP

  @JvmStatic public fun defaultTileMode(): TileMode = TileMode.CLAMP
}
