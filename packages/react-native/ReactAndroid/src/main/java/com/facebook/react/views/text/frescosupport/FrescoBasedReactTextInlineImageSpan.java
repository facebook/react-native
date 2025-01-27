/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.frescosupport;

import android.content.res.Resources;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.util.Preconditions;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;
import com.facebook.drawee.interfaces.DraweeController;
import com.facebook.drawee.view.DraweeHolder;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.fresco.ReactNetworkImageRequest;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.views.image.ImageResizeMode;
import com.facebook.react.views.text.internal.span.TextInlineImageSpan;

/**
 * FrescoBasedTextInlineImageSpan is a span for Images that are inside <Text/>. It computes its size
 * based on the input size. When it is time to draw, it will use the Fresco framework to get the
 * right Drawable and let that draw.
 *
 * <p>Since Fresco needs to callback to the TextView that contains this, in the ViewManager, you
 * must tell the Span about the TextView
 *
 * <p>Note: It borrows code from DynamicDrawableSpan and if that code updates how it computes size
 * or draws, we need to update this as well.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
class FrescoBasedReactTextInlineImageSpan extends TextInlineImageSpan {

  private @Nullable Drawable mDrawable;
  private final AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final DraweeHolder<GenericDraweeHierarchy> mDraweeHolder;
  private final @Nullable Object mCallerContext;

  private int mHeight;
  private int mTintColor;
  private Uri mUri;
  private int mWidth;
  private @Nullable ReadableMap mHeaders;
  private @Nullable String mResizeMode;

  private @Nullable TextView mTextView;

  public FrescoBasedReactTextInlineImageSpan(
      Resources resources,
      int height,
      int width,
      int tintColor,
      @Nullable Uri uri,
      @Nullable ReadableMap headers,
      AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable Object callerContext,
      @Nullable String resizeMode) {
    mDraweeHolder = new DraweeHolder(GenericDraweeHierarchyBuilder.newInstance(resources).build());
    mDraweeControllerBuilder = draweeControllerBuilder;
    mCallerContext = callerContext;
    mTintColor = tintColor;
    mUri = (uri != null) ? uri : Uri.EMPTY;
    mHeaders = headers;
    mWidth = (int) (PixelUtil.toPixelFromDIP(width));
    mHeight = (int) (PixelUtil.toPixelFromDIP(height));
    mResizeMode = resizeMode;
  }

  /**
   * The ReactTextView that holds this ImageSpan is responsible for passing these methods on so that
   * we can do proper lifetime management for Fresco
   */
  public void onDetachedFromWindow() {
    mDraweeHolder.onDetach();
  }

  public void onStartTemporaryDetach() {
    mDraweeHolder.onDetach();
  }

  public void onAttachedToWindow() {
    mDraweeHolder.onAttach();
  }

  public void onFinishTemporaryDetach() {
    mDraweeHolder.onAttach();
  }

  public @Nullable Drawable getDrawable() {
    return mDrawable;
  }

  @Override
  public int getSize(Paint paint, CharSequence text, int start, int end, Paint.FontMetricsInt fm) {
    // NOTE: This getSize code is copied from DynamicDrawableSpan and modified to not use a Drawable

    if (fm != null) {
      fm.ascent = -mHeight;
      fm.descent = 0;

      fm.top = fm.ascent;
      fm.bottom = 0;
    }

    return mWidth;
  }

  @Override
  public void setTextView(@Nullable TextView textView) {
    mTextView = textView;
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
    if (mDrawable == null) {
      ImageRequestBuilder imageRequestBuilder = ImageRequestBuilder.newBuilderWithSource(mUri);
      ImageRequest imageRequest =
          ReactNetworkImageRequest.fromBuilderWithHeaders(imageRequestBuilder, mHeaders);
      mDraweeHolder
          .getHierarchy()
          .setActualImageScaleType(ImageResizeMode.toScaleType(mResizeMode));
      mDraweeControllerBuilder.reset();
      mDraweeControllerBuilder.setOldController(mDraweeHolder.getController());
      if (mCallerContext != null) {
        mDraweeControllerBuilder.setCallerContext(mCallerContext);
      }
      mDraweeControllerBuilder.setImageRequest(imageRequest);
      DraweeController draweeController = mDraweeControllerBuilder.build();
      mDraweeHolder.setController(draweeController);
      mDraweeControllerBuilder.reset();

      mDrawable = Preconditions.checkNotNull(mDraweeHolder.getTopLevelDrawable());
      mDrawable.setBounds(0, 0, mWidth, mHeight);
      if (mTintColor != 0) {
        mDrawable.setColorFilter(mTintColor, PorterDuff.Mode.SRC_IN);
      }
      mDrawable.setCallback(mTextView);
    }

    // NOTE: This drawing code is copied from DynamicDrawableSpan

    canvas.save();

    // Align to center
    int fontHeight = (int) (paint.descent() - paint.ascent());
    int centerY = y + (int) paint.descent() - fontHeight / 2;
    int transY = centerY - (mDrawable.getBounds().bottom - mDrawable.getBounds().top) / 2;

    canvas.translate(x, transY);
    mDrawable.draw(canvas);
    canvas.restore();
  }

  @Override
  public int getWidth() {
    return mWidth;
  }

  @Override
  public int getHeight() {
    return mHeight;
  }
}
