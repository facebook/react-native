/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.toolbar;

import android.graphics.drawable.Drawable;

import com.facebook.drawee.drawable.ForwardingDrawable;
import com.facebook.imagepipeline.image.ImageInfo;
import com.facebook.react.uimanager.PixelUtil;

/**
 * Fresco currently sets drawables' intrinsic size to (-1, -1). This is to guarantee that scaling is
 * performed correctly. In the case of the Toolbar, we don't have access to the widget's internal
 * ImageView, which has width/height set to WRAP_CONTENT, which relies on intrinsic size.
 *
 * To work around this we have this class which just wraps another Drawable, but returns the correct
 * dimensions in getIntrinsicWidth/Height. This makes WRAP_CONTENT work in Toolbar's internals.
 *
 * This drawable uses the size of a loaded image to determine the intrinsic size. It therefore can't
 * be used safely until *after* an image has loaded, and must be replaced when the image is
 * replaced.
 */
public class DrawableWithIntrinsicSize extends ForwardingDrawable implements Drawable.Callback {

  private final ImageInfo mImageInfo;

  public DrawableWithIntrinsicSize(Drawable drawable, ImageInfo imageInfo) {
    super(drawable);
    mImageInfo = imageInfo;
  }

  @Override
  public int getIntrinsicWidth() {
    return mImageInfo.getWidth();
  }

  @Override
  public int getIntrinsicHeight() {
    return mImageInfo.getHeight();
  }

}
