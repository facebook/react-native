/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.frescosupport;

import android.graphics.Color;
import android.graphics.PorterDuff;
import com.facebook.react.uimanager.PixelUtil;
import javax.annotation.Nullable;

import android.content.res.Resources;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.widget.TextView;

import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;
import com.facebook.drawee.interfaces.DraweeController;
import com.facebook.drawee.view.DraweeHolder;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.views.text.TextInlineImageSpan;
import com.facebook.react.modules.fresco.ReactNetworkImageRequest;

/**
 * FrescoBasedTextInlineImageSpan is a span for Images that are inside <Text/>. It computes
 * its size based on the input size. When it is time to draw, it will use the Fresco framework to
 * get the right Drawable and let that draw.
 *
 * Since Fresco needs to callback to the TextView that contains this, in the ViewManager, you must
 * tell the Span about the TextView
 *
 * Note: It borrows code from DynamicDrawableSpan and if that code updates how it computes size or
 * draws, we need to update this as well.
 */
public class FrescoBasedReactTextInlineImageSpan extends TextInlineImageSpan {

  private @Nullable Drawable mDrawable;
  private final AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final DraweeHolder<GenericDraweeHierarchy> mDraweeHolder;
  private final @Nullable Object mCallerContext;

  private int mHeight;
  private int mTintColor;
  private Uri mUri;
  private int mWidth;
  private ReadableMap mHeaders;

  private @Nullable TextView mTextView;

  public FrescoBasedReactTextInlineImageSpan(
      Resources resources,
      int height,
      int width,
      int tintColor,
      @Nullable Uri uri,
      ReadableMap headers,
      AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable Object callerContext) {
    mDraweeHolder = new DraweeHolder(
        GenericDraweeHierarchyBuilder.newInstance(resources)
            .build()
    );
    mDraweeControllerBuilder = draweeControllerBuilder;
    mCallerContext = callerContext;
    mTintColor = tintColor;
    mUri = (uri != null) ? uri : Uri.EMPTY;
    mHeaders = headers;
    mWidth = (int)(PixelUtil.toPixelFromDIP(width));
    mHeight = (int)(PixelUtil.toPixelFromDIP(height));

  }

  /**
   * The ReactTextView that holds this ImageSpan is responsible for passing these methods on so
   * that we can do proper lifetime management for Fresco
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
  public int getSize(
      Paint paint, CharSequence text, int start, int end, Paint.FontMetricsInt fm) {
    // NOTE: This getSize code is copied from DynamicDrawableSpan and modified to not use a Drawable

    if (fm != null) {
      fm.ascent = -mHeight;
      fm.descent = 0;

      fm.top = fm.ascent;
      fm.bottom = 0;
    }

    return mWidth;
  }

  public void setTextView(TextView textView) {
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
      ImageRequest imageRequest = ReactNetworkImageRequest.fromBuilderWithHeaders(imageRequestBuilder, mHeaders);

      DraweeController draweeController = mDraweeControllerBuilder
          .reset()
          .setOldController(mDraweeHolder.getController())
          .setCallerContext(mCallerContext)
          .setImageRequest(imageRequest)
          .build();
      mDraweeHolder.setController(draweeController);
      mDraweeControllerBuilder.reset();

      mDrawable = mDraweeHolder.getTopLevelDrawable();
      mDrawable.setBounds(0, 0, mWidth, mHeight);
      if(mTintColor != 0) {
        mDrawable.setColorFilter(mTintColor, PorterDuff.Mode.SRC_IN);
      }
      mDrawable.setCallback(mTextView);

    }

    // NOTE: This drawing code is copied from DynamicDrawableSpan

    canvas.save();

    // Align to center
    int fontHeight = (int)(paint.descent() - paint.ascent());
    int centerY = y + (int)paint.descent() - fontHeight / 2;
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
