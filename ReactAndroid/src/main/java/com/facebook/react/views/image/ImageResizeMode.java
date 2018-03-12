/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import javax.annotation.Nullable;

import android.graphics.Shader;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.drawee.drawable.ScalingUtils;

/**
 * Converts JS resize modes into Android-specific scale type.
 */
public class ImageResizeMode {

  /**
   * Converts JS resize modes into {@code ScalingUtils.ScaleType}.
   * See {@code ImageResizeMode.js}.
   */
  public static ScalingUtils.ScaleType toScaleType(@Nullable String resizeModeValue) {
    if ("contain".equals(resizeModeValue)) {
      return ScalingUtils.ScaleType.FIT_CENTER;
    }
    if ("cover".equals(resizeModeValue)) {
      return ScalingUtils.ScaleType.CENTER_CROP;
    }
    if ("stretch".equals(resizeModeValue)) {
      return ScalingUtils.ScaleType.FIT_XY;
    }
    if ("center".equals(resizeModeValue)) {
      return ScalingUtils.ScaleType.CENTER_INSIDE;
    }
    if ("repeat".equals(resizeModeValue)) {
      // Handled via a combination of ScaleType and TileMode
      return ScaleTypeStartInside.INSTANCE;
    }
    if (resizeModeValue == null) {
      // Use the default. Never use null.
      return defaultValue();
    }
    throw new JSApplicationIllegalArgumentException(
        "Invalid resize mode: '" + resizeModeValue + "'");
  }

  /**
   * Converts JS resize modes into {@code Shader.TileMode}.
   * See {@code ImageResizeMode.js}.
   */
  public static Shader.TileMode toTileMode(@Nullable String resizeModeValue) {
    if ("contain".equals(resizeModeValue)
        || "cover".equals(resizeModeValue)
        || "stretch".equals(resizeModeValue)
        || "center".equals(resizeModeValue)) {
      return Shader.TileMode.CLAMP;
    }
    if ("repeat".equals(resizeModeValue)) {
      // Handled via a combination of ScaleType and TileMode
      return Shader.TileMode.REPEAT;
    }
    if (resizeModeValue == null) {
      // Use the default. Never use null.
      return defaultTileMode();
    }
    throw new JSApplicationIllegalArgumentException(
        "Invalid resize mode: '" + resizeModeValue + "'");
  }

  /**
   * This is the default as per web and iOS.
   * We want to be consistent across platforms.
   */
  public static ScalingUtils.ScaleType defaultValue() {
    return ScalingUtils.ScaleType.CENTER_CROP;
  }

  public static Shader.TileMode defaultTileMode() {
    return Shader.TileMode.CLAMP;
  }
}
