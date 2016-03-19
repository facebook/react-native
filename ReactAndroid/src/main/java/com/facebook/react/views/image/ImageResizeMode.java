/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.image;

import javax.annotation.Nullable;

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
    if (resizeModeValue == null) {
      // Use the default. Never use null.
      return defaultValue();
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
}
