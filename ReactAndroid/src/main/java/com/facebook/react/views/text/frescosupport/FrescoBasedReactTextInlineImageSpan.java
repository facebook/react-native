/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.textfrescosupport;

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
import com.facebook.react.views.text.TextInlineImageSpan;

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
  private Uri mUri;
  private int mWidth;

  private @Nullable TextView mTextView;

  public FrescoBasedReactTextInlineImageSpan(
      Resources resources,
      int height,
      int width,
      @Nullable Uri uri,
      AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable Object callerContext) {
    mDraweeHolder = new DraweeHolder(
        GenericDraweeHierarchyBuilder.newInstance(resources)
            .build()
    );
    mDraweeControllerBuilder = draweeControllerBuilder;
    mCallerContext = callerContext;

    mHeight = height;
    mWidth = width;
    mUri = (uri != null) ? uri : Uri.EMPTY;
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
      ImageRequest imageRequest = ImageRequestBuilder.newBuilderWithSource(mUri)
          .build();

      DraweeController draweeController = mDraweeControllerBuilder
          .reset()
          .setOldController(mDraweeHolder.getController())
          .setCallerContext(mCallerContext)
          .setImageRequest(imageRequest)
          .build();
      mDraweeHolder.setController(draweeController);

      mDrawable = mDraweeHolder.getTopLevelDrawable();
      mDrawable.setBounds(0, 0, mWidth, mHeight);
      mDrawable.setCallback(mTextView);
    }

    // NOTE: This drawing code is copied from DynamicDrawableSpan

    canvas.save();

    int transY = bottom - mDrawable.getBounds().bottom;

    // Align to baseline by default
    transY -= paint.getFontMetricsInt().descent;

    canvas.translate(x, transY);
    mDrawable.draw(canvas);
    canvas.restore();
  }
}
