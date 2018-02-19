/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.content.Context;

import com.facebook.drawee.drawable.ScalingUtils.ScaleType;
import com.facebook.react.bridge.ReadableArray;

/**
 * Common interface for DrawImageWithDrawee.
 */
/* package */ interface DrawImage extends AttachDetachListener {
  /**
   * Returns true if an image source was assigned to the DrawImage.
   * A DrawImage with no source will not draw anything.
   */
  boolean hasImageRequest();

  /**
   * Assigns a new image source to the DrawImage, or null to clear the image request.
   */
  void setSource(Context context, @Nullable ReadableArray sources);

  /**
   * Assigns a tint color to apply to the image drawn.
   */
  void setTintColor(int tintColor);

  /**
   * Assigns a scale type to draw to the image with.
   */
  void setScaleType(ScaleType scaleType);

  /**
   * Returns a scale type to draw to the image with.
   */
  ScaleType getScaleType();

  /**
   * React tag used for dispatching ImageLoadEvents, or 0 to ignore events.
   */
  void setReactTag(int reactTag);

  void setBorderWidth(float borderWidth);

  float getBorderWidth();

  void setBorderRadius(float borderRadius);

  float getBorderRadius();

  void setBorderColor(int borderColor);

  int getBorderColor();

  void setFadeDuration(int fadeDuration);

  void setProgressiveRenderingEnabled(boolean enabled);
}
