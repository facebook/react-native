/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import javax.annotation.Nullable;

import android.content.res.Resources;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.text.Spannable;
import android.text.style.ReplacementSpan;
import android.widget.TextView;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;
import com.facebook.drawee.interfaces.DraweeController;
import com.facebook.drawee.view.DraweeHolder;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;

/**
 * TextInlineImageSpan is a span for Images that are inside <Text/>.  It computes it's size based
 * on the input size.  When it is time to draw, it will use the Fresco framework to get the right
 * Drawable and let that draw.
 *
 * Since Fresco needs to callback to the TextView that contains this, in the ViewManager, you must
 * tell the Span about the TextView
 *
 * Note: It borrows code from DynamicDrawableSpan and if that code updates how it computes size or
 * draws, we need to update this as well.
 */
public class TextInlineImageSpan extends ReplacementSpan {

  private @Nullable Drawable mDrawable;
  private final AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final DraweeHolder<GenericDraweeHierarchy> mDraweeHolder;
  private final @Nullable Object mCallerContext;

  private int mHeight;
  private Uri mUri;
  private int mWidth;

  private @Nullable TextView mTextView;

  public TextInlineImageSpan(
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

    canvas.translate(x, transY);
    mDrawable.draw(canvas);
    canvas.restore();
  }

  /**
   * For TextInlineImageSpan we need to update the Span to know that the window is attached and
   * the TextView that we will set as the callback on the Drawable.
   *
   * @param spannable The spannable that may contain TextInlineImageSpans
   * @param view The view which will be set as the callback for the Drawable
   */
  public static void possiblyUpdateInlineImageSpans(Spannable spannable, TextView view) {
    TextInlineImageSpan[] spans =
        spannable.getSpans(0, spannable.length(), TextInlineImageSpan.class);
    for (TextInlineImageSpan span : spans) {
      span.onAttachedToWindow();
      span.mTextView = view;
    }
  };
}
