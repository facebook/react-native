/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.PixelFormat;
import android.graphics.drawable.Animatable;
import android.graphics.drawable.Drawable;
import com.facebook.drawee.controller.ControllerListener;
import com.facebook.drawee.drawable.ForwardingDrawable;
import javax.annotation.Nullable;

public class ReactImageDownloadListener<INFO> extends ForwardingDrawable
    implements ControllerListener<INFO> {

  private static final int MAX_LEVEL = 10000;

  public ReactImageDownloadListener() {
    super(new EmptyDrawable());
  }

  public void onProgressChange(int loaded, int total) {}

  @Override
  protected boolean onLevelChange(int level) {
    onProgressChange(level, MAX_LEVEL);
    return super.onLevelChange(level);
  }

  @Override
  public void onSubmit(String id, Object callerContext) {}

  @Override
  public void onFinalImageSet(
      String id, @Nullable INFO imageInfo, @Nullable Animatable animatable) {}

  @Override
  public void onIntermediateImageSet(String id, @Nullable INFO imageInfo) {}

  @Override
  public void onIntermediateImageFailed(String id, Throwable throwable) {}

  @Override
  public void onFailure(String id, Throwable throwable) {}

  @Override
  public void onRelease(String id) {}

  /** A {@link Drawable} that renders nothing. */
  private static final class EmptyDrawable extends Drawable {

    @Override
    public void draw(Canvas canvas) {
      // Do nothing.
    }

    @Override
    public void setAlpha(int alpha) {
      // Do nothing.
    }

    @Override
    public void setColorFilter(ColorFilter colorFilter) {
      // Do nothing.
    }

    @Override
    public int getOpacity() {
      return PixelFormat.OPAQUE;
    }
  }
}
