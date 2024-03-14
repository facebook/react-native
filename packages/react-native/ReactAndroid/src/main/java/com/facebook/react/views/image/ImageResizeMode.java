/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import android.graphics.Shader;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.drawee.drawable.ScalingUtils;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.common.ReactConstants;

/** Converts JS resize modes into Android-specific scale type. */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ImageResizeMode {

  private static final String RESIZE_MODE_CONTAIN = "contain";
  private static final String RESIZE_MODE_COVER = "cover";
  private static final String RESIZE_MODE_STRETCH = "stretch";
  private static final String RESIZE_MODE_CENTER = "center";
  private static final String RESIZE_MODE_REPEAT = "repeat";

  /**
   * Converts JS resize modes into {@code ScalingUtils.ScaleType}. See {@code ImageResizeMode.js}.
   */
  public static ScalingUtils.ScaleType toScaleType(@Nullable String resizeModeValue) {
    if (RESIZE_MODE_CONTAIN.equals(resizeModeValue)) {
      return ScalingUtils.ScaleType.FIT_CENTER;
    }
    if (RESIZE_MODE_COVER.equals(resizeModeValue)) {
      return ScalingUtils.ScaleType.CENTER_CROP;
    }
    if (RESIZE_MODE_STRETCH.equals(resizeModeValue)) {
      return ScalingUtils.ScaleType.FIT_XY;
    }
    if (RESIZE_MODE_CENTER.equals(resizeModeValue)) {
      return ScalingUtils.ScaleType.CENTER_INSIDE;
    }
    if (RESIZE_MODE_REPEAT.equals(resizeModeValue)) {
      // Handled via a combination of ScaleType and TileMode
      return ScaleTypeStartInside.INSTANCE;
    }
    if (resizeModeValue != null) {
      FLog.w(ReactConstants.TAG, "Invalid resize mode: '" + resizeModeValue + "'");
    }
    // Use the default. Never use null.
    return defaultValue();
  }

  /** Converts JS resize modes into {@code Shader.TileMode}. See {@code ImageResizeMode.js}. */
  public static Shader.TileMode toTileMode(@Nullable String resizeModeValue) {
    if (RESIZE_MODE_CONTAIN.equals(resizeModeValue)
        || RESIZE_MODE_COVER.equals(resizeModeValue)
        || RESIZE_MODE_STRETCH.equals(resizeModeValue)
        || RESIZE_MODE_CENTER.equals(resizeModeValue)) {
      return Shader.TileMode.CLAMP;
    }
    if (RESIZE_MODE_REPEAT.equals(resizeModeValue)) {
      // Handled via a combination of ScaleType and TileMode
      return Shader.TileMode.REPEAT;
    }
    if (resizeModeValue != null) {
      FLog.w(ReactConstants.TAG, "Invalid resize mode: '" + resizeModeValue + "'");
    }
    // Use the default. Never use null.
    return defaultTileMode();
  }

  /** This is the default as per web and iOS. We want to be consistent across platforms. */
  public static ScalingUtils.ScaleType defaultValue() {
    return ScalingUtils.ScaleType.CENTER_CROP;
  }

  public static Shader.TileMode defaultTileMode() {
    return Shader.TileMode.CLAMP;
  }
}
