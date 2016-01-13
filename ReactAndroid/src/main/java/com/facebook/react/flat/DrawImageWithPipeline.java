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

import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;
import android.graphics.Shader;

import com.facebook.drawee.drawable.ScalingUtils.ScaleType;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.views.image.ImageResizeMode;

/**
 * DrawImageWithPipeline is DrawCommand that can draw a local or remote image.
 * It uses PipelineRequestHelper internally to fetch and cache the images.
 */
/* package */ final class DrawImageWithPipeline extends AbstractDrawBorder
    implements DrawImage, BitmapUpdateListener {

  private static final Paint PAINT = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
  private static final int BORDER_BITMAP_PATH_DIRTY = 1 << 1;

  private final Matrix mTransform = new Matrix();
  private ScaleType mScaleType = ImageResizeMode.defaultValue();
  private @Nullable PipelineRequestHelper mRequestHelper;
  private @Nullable PorterDuffColorFilter mColorFilter;
  private @Nullable FlatViewGroup.InvalidateCallback mCallback;
  private @Nullable Path mPathForRoundedBitmap;
  private @Nullable BitmapShader mBitmapShader;
  private boolean mForceClip;
  private int mReactTag;

  @Override
  public boolean hasImageRequest() {
    return mRequestHelper != null;
  }

  @Override
  public void setImageRequest(@Nullable ImageRequest imageRequest) {
    mBitmapShader = null;

    if (imageRequest == null) {
      mRequestHelper = null;
    } else {
      mRequestHelper = new PipelineRequestHelper(imageRequest);
    }
  }

  @Override
  public void setTintColor(int tintColor) {
    if (tintColor == 0) {
      mColorFilter = null;
    } else {
      mColorFilter = new PorterDuffColorFilter(tintColor, PorterDuff.Mode.SRC_ATOP);
    }
  }

  @Override
  public void setScaleType(ScaleType scaleType) {
    mScaleType = scaleType;
  }

  @Override
  public ScaleType getScaleType() {
    return mScaleType;
  }

  @Override
  public void setReactTag(int reactTag) {
    mReactTag = reactTag;
  }

  @Override
  protected void onDraw(Canvas canvas) {
    Bitmap bitmap = Assertions.assumeNotNull(mRequestHelper).getBitmap();
    if (bitmap == null) {
      return;
    }

    PAINT.setColorFilter(mColorFilter);

    if (getBorderRadius() < 0.5f) {
      canvas.drawBitmap(bitmap, mTransform, PAINT);
    } else {
      if (mBitmapShader == null) {
        mBitmapShader = new BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
        mBitmapShader.setLocalMatrix(mTransform);
      }
      PAINT.setShader(mBitmapShader);
      canvas.drawPath(getPathForRoundedBitmap(), PAINT);
    }

    drawBorders(canvas);
  }

  @Override
  protected boolean shouldClip() {
    return mForceClip || super.shouldClip();
  }

  @Override
  public void setBorderRadius(float borderRadius) {
    super.setBorderRadius(borderRadius);
    setFlag(BORDER_BITMAP_PATH_DIRTY);
  }

  @Override
  public void onAttached(FlatViewGroup.InvalidateCallback callback) {
    mCallback = callback;
    Assertions.assumeNotNull(mRequestHelper).attach(this);
  }

  @Override
  public void onDetached() {
    Assertions.assumeNotNull(mRequestHelper).detach();

    if (mRequestHelper.isDetached()) {
      // Make sure we don't hold on to the Bitmap.
      mBitmapShader = null;
      // this is optional
      mCallback = null;
    }
  }

  @Override
  protected void onBoundsChanged() {
    super.onBoundsChanged();
    setFlag(BORDER_BITMAP_PATH_DIRTY);
  }

  @Override
  public void onSecondaryAttach(Bitmap bitmap) {
    updateBounds(bitmap);
  }

  @Override
  public void onBitmapReady(Bitmap bitmap) {
    updateBounds(bitmap);
  }

  @Override
  public void onImageLoadEvent(int imageLoadEvent) {
    if (mReactTag != 0 && mCallback != null) {
      mCallback.dispatchImageLoadEvent(mReactTag, imageLoadEvent);
    }
  }

  /* package */ void updateBounds(Bitmap bitmap) {
    Assertions.assumeNotNull(mCallback).invalidate();

    float left = getLeft();
    float top = getTop();

    float containerWidth = getRight() - left;
    float containerHeight = getBottom() - top;

    float imageWidth = (float) bitmap.getWidth();
    float imageHeight = (float) bitmap.getHeight();

    mForceClip = false;

    if (mScaleType == ScaleType.FIT_XY) {
      mTransform.setScale(containerWidth / imageWidth, containerHeight / imageHeight);
      mTransform.postTranslate(left, top);
      return;
    }

    final float scale;

    if (mScaleType == ScaleType.CENTER_INSIDE) {
      final float ratio;
      if (containerWidth >= imageWidth && containerHeight >= imageHeight) {
        scale = 1.0f;
      } else {
        scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
      }
    } else {
      scale = Math.max(containerWidth / imageWidth, containerHeight / imageHeight);
    }

    float paddingLeft = (containerWidth - imageWidth * scale) / 2;
    float paddingTop = (containerHeight - imageHeight * scale) / 2;

    mForceClip = paddingLeft < 0 || paddingTop < 0;

    mTransform.setScale(scale, scale);
    mTransform.postTranslate(left + paddingLeft, top + paddingTop);

    if (mBitmapShader != null) {
      mBitmapShader.setLocalMatrix(mTransform);
    }
  }

  private Path getPathForRoundedBitmap() {
    if (isFlagSet(BORDER_BITMAP_PATH_DIRTY)) {
      if (mPathForRoundedBitmap == null) {
        mPathForRoundedBitmap = new Path();
      }

      updatePath(mPathForRoundedBitmap, 1.0f);

      resetFlag(BORDER_BITMAP_PATH_DIRTY);
    }

    return mPathForRoundedBitmap;
  }
}
