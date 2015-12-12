/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import com.facebook.drawee.drawable.ScalingUtils.ScaleType;
import com.facebook.imagepipeline.request.ImageRequest;

/**
 * Common interface for DrawImageWithPipeline and DrawImageWithDrawee.
 */
/* package */ interface DrawImage extends DrawCommand, AttachDetachListener {
  /**
   * Returns true if an image source was assigned to the DrawImage.
   * A DrawImage with no source will not draw anything.
   */
  public boolean hasImageRequest();

  /**
   * Assigns a new image request to the DrawImage, or null to clear the image request.
   */
  public void setImageRequest(@Nullable ImageRequest imageRequest);

  /**
   * Assigns a tint color to apply to the image drawn.
   */
  public void setTintColor(int tintColor);

  /**
   * Assigns a scale type to draw to the image with.
   */
  public void setScaleType(ScaleType scaleType);

  /**
   * Returns a scale type to draw to the image with.
   */
  public ScaleType getScaleType();

  public void setBorderWidth(float borderWidth);

  public float getBorderWidth();

  public void setBorderRadius(float borderRadius);

  public float getBorderRadius();

  public void setBorderColor(int borderColor);

  public int getBorderColor();
}
