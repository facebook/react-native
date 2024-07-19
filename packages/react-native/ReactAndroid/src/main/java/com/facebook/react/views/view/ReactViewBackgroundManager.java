/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.View;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.uimanager.drawable.CSSBackgroundDrawable;

/** Class that manages the background for views and borders. */
@UnstableReactNativeAPI
public class ReactViewBackgroundManager {
  private static enum Overflow {
    VISIBLE,
    HIDDEN,
    SCROLL,
  }

  private @Nullable CSSBackgroundDrawable mCSSBackgroundDrawable;
  private View mView;
  private int mColor = Color.TRANSPARENT;
  private Overflow mOverflow = Overflow.VISIBLE;

  public ReactViewBackgroundManager(View view) {
    mView = view;
  }

  public void cleanup() {
    ViewCompat.setBackground(mView, null);
    mView = null;
    mCSSBackgroundDrawable = null;
  }

  private CSSBackgroundDrawable getOrCreateReactViewBackground() {
    if (mCSSBackgroundDrawable == null) {
      mCSSBackgroundDrawable = new CSSBackgroundDrawable(mView.getContext());
      Drawable backgroundDrawable = mView.getBackground();
      ViewCompat.setBackground(
          mView, null); // required so that drawable callback is cleared before we add the
      // drawable back as a part of LayerDrawable
      if (backgroundDrawable == null) {
        ViewCompat.setBackground(mView, mCSSBackgroundDrawable);
      } else {
        LayerDrawable layerDrawable =
            new LayerDrawable(new Drawable[] {mCSSBackgroundDrawable, backgroundDrawable});
        ViewCompat.setBackground(mView, layerDrawable);
      }
    }
    return mCSSBackgroundDrawable;
  }

  public void setBackgroundColor(int color) {
    if (color == Color.TRANSPARENT && mCSSBackgroundDrawable == null) {
      // don't do anything, no need to allocate ReactBackgroundDrawable for transparent background
    } else {
      getOrCreateReactViewBackground().setColor(color);
    }
  }

  public int getBackgroundColor() {
    return mColor;
  }

  public void setBorderWidth(int position, float width) {
    getOrCreateReactViewBackground().setBorderWidth(position, width);
  }

  public void setBorderColor(int position, @Nullable Integer color) {
    getOrCreateReactViewBackground().setBorderColor(position, color);
  }

  public int getBorderColor(int position) {
    return getOrCreateReactViewBackground().getBorderColor(position);
  }

  public void setBorderRadius(float borderRadius) {
    getOrCreateReactViewBackground().setRadius(borderRadius);
  }

  public void setBorderRadius(float borderRadius, int position) {
    getOrCreateReactViewBackground().setRadius(borderRadius, position);
  }

  public void setBorderStyle(@Nullable String style) {
    getOrCreateReactViewBackground().setBorderStyle(style);
  }

  public void setOverflow(@Nullable String overflow) {
    Overflow lastOverflow = mOverflow;

    if ("hidden".equals(overflow)) {
      mOverflow = Overflow.HIDDEN;
    } else if ("scroll".equals(overflow)) {
      mOverflow = Overflow.SCROLL;
    } else {
      mOverflow = Overflow.VISIBLE;
    }

    if (lastOverflow != mOverflow) {
      mView.invalidate();
    }
  }

  /**
   * Sets the canvas clipping region to exclude any area below or outside of borders if "overflow"
   * is set to clip to padding box.
   */
  public void maybeClipToPaddingBox(Canvas canvas) {
    if (mOverflow == Overflow.VISIBLE) {
      return;
    }

    // The canvas may be scrolled, so we need to offset
    Rect drawingRect = new Rect();
    mView.getDrawingRect(drawingRect);

    @Nullable CSSBackgroundDrawable cssBackground = mCSSBackgroundDrawable;
    if (cssBackground == null) {
      canvas.clipRect(drawingRect);
      return;
    }

    @Nullable Path paddingBoxPath = cssBackground.getPaddingBoxPath();
    if (paddingBoxPath != null) {
      paddingBoxPath.offset(drawingRect.left, drawingRect.top);
      canvas.clipPath(paddingBoxPath);
    } else {
      RectF paddingBoxRect = cssBackground.getPaddingBoxRect();
      paddingBoxRect.offset(drawingRect.left, drawingRect.top);
      canvas.clipRect(paddingBoxRect);
    }
  }
}
