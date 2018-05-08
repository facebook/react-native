/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.text.style.ReplacementSpan;

import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.infer.annotation.Assertions;

/* package */ final class InlineImageSpanWithPipeline extends ReplacementSpan
    implements AttachDetachListener, BitmapUpdateListener {

  private static final RectF TMP_RECT = new RectF();

  private @Nullable PipelineRequestHelper mRequestHelper;
  private @Nullable FlatViewGroup.InvalidateCallback mCallback;
  private float mWidth;
  private float mHeight;
  private boolean mFrozen;

  /* package */ InlineImageSpanWithPipeline() {
    this(null, Float.NaN, Float.NaN);
  }

  private InlineImageSpanWithPipeline(
      @Nullable PipelineRequestHelper requestHelper,
      float width,
      float height) {
    mRequestHelper = requestHelper;
    mWidth = width;
    mHeight = height;
  }

  /* package */ InlineImageSpanWithPipeline mutableCopy() {
    return new InlineImageSpanWithPipeline(mRequestHelper, mWidth, mHeight);
  }

  /* package */ boolean hasImageRequest() {
    return mRequestHelper != null;
  }

  /**
   * Assigns a new image request to the DrawImage, or null to clear the image request.
   */
  /* package */ void setImageRequest(@Nullable ImageRequest imageRequest) {
    if (imageRequest == null) {
      mRequestHelper = null;
    } else {
      mRequestHelper = new PipelineRequestHelper(imageRequest);
    }
  }

  /* package */ float getWidth() {
    return mWidth;
  }

  /* package */ void setWidth(float width) {
    mWidth = width;
  }

  /* package */ float getHeight() {
    return mHeight;
  }

  /* package */ void setHeight(float height) {
    mHeight = height;
  }

  /* package */ void freeze() {
    mFrozen = true;
  }

  /* package */ boolean isFrozen() {
    return mFrozen;
  }

  @Override
  public void onSecondaryAttach(Bitmap bitmap) {
    // We don't know if width or height changed, so invalidate just in case.
    Assertions.assumeNotNull(mCallback).invalidate();
  }

  @Override
  public void onBitmapReady(Bitmap bitmap) {
    // Bitmap is now ready, draw it.
    Assertions.assumeNotNull(mCallback).invalidate();
  }

  @Override
  public void onImageLoadEvent(int imageLoadEvent) {
    // ignore
  }

  @Override
  public void onAttached(FlatViewGroup.InvalidateCallback callback) {
    mCallback = callback;

    if (mRequestHelper != null) {
      mRequestHelper.attach(this);
    }
  }

  @Override
  public void onDetached() {
    if (mRequestHelper != null) {
      mRequestHelper.detach();

      if (mRequestHelper.isDetached()) {
        // optional
        mCallback = null;
      }
    }
  }

  @Override
  public int getSize(Paint paint, CharSequence text, int start, int end, Paint.FontMetricsInt fm) {
    if (fm != null) {
      fm.ascent = -Math.round(mHeight);
      fm.descent = 0;

      fm.top = fm.ascent;
      fm.bottom = 0;
    }

    return Math.round(mWidth);
  }

  @Override
  public void draw(
      Canvas canvas,
      CharSequence text,
      int start,
      int end,
      float x,
      int top,
      int y,
      int bottom,
      Paint paint) {
    if (mRequestHelper == null) {
      return;
    }

    Bitmap bitmap = mRequestHelper.getBitmap();
    if (bitmap == null) {
      return;
    }

    float bottomFloat = (float) bottom - paint.getFontMetricsInt().descent;
    TMP_RECT.set(x, bottomFloat - mHeight, x + mWidth, bottomFloat);

    canvas.drawBitmap(bitmap, null, TMP_RECT, paint);
  }
}
