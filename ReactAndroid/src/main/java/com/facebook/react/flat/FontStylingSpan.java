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

import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;

/* package */ final class FontStylingSpan extends MetricAffectingSpan {
  // text property
  private final double mTextColor;
  private final int mBackgroundColor;

  // font properties
  private final int mFontSize;
  private final int mFontStyle;
  private final int mFontWeight;
  private final @Nullable String mFontFamily;

  FontStylingSpan(
      double textColor,
      int backgroundColor,
      int fontSize,
      int fontStyle,
      int fontWeight,
      @Nullable String fontFamily) {
    mTextColor = textColor;
    mBackgroundColor = backgroundColor;
    mFontSize = fontSize;
    mFontStyle = fontStyle;
    mFontWeight = fontWeight;
    mFontFamily = fontFamily;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    if (!Double.isNaN(mTextColor)) {
      ds.setColor((int) mTextColor);
    }

    ds.bgColor = mBackgroundColor;
    updateMeasureState(ds);
  }

  @Override
  public void updateMeasureState(TextPaint ds) {
    if (mFontSize != -1) {
      ds.setTextSize(mFontSize);
    }

    updateTypeface(ds);
  }

  private int getNewStyle(int oldStyle) {
    int newStyle = oldStyle;
    if (mFontStyle != -1) {
      newStyle = (newStyle & ~Typeface.ITALIC) | mFontStyle;
    }

    if (mFontWeight != -1) {
      newStyle = (newStyle & ~Typeface.BOLD) | mFontWeight;
    }

    return newStyle;
  }

  private void updateTypeface(TextPaint ds) {
    Typeface typeface = ds.getTypeface();

    int oldStyle = (typeface == null) ? 0 : typeface.getStyle();
    int newStyle = getNewStyle(oldStyle);

    if (oldStyle == newStyle && mFontFamily == null) {
      // nothing to do
      return;
    }

    if (mFontFamily != null) {
      typeface = TypefaceCache.getTypeface(mFontFamily, newStyle);
    } else {
      typeface = TypefaceCache.getTypeface(typeface, newStyle);
    }

    ds.setTypeface(typeface);
  }
}
