/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.graphics.Color;
import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;

/* package */ final class FontStylingSpan extends MetricAffectingSpan {

  /* package */ static final FontStylingSpan INSTANCE = new FontStylingSpan(
      Color.BLACK /* mTextColor */,
      0 /* mBackgroundColor */,
      -1 /* mFontSize */,
      -1 /* mFontStyle */,
      -1 /* mFontWeight */,
      false /* mHasUnderline */,
      false /* mHasStrikeThrough */,
      null /* mFontFamily */,
      true /* mFrozen */);

  // text property
  private double mTextColor;
  private int mBackgroundColor;
  private boolean mHasUnderline;
  private boolean mHasStrikeThrough;

  // font properties
  private int mFontSize;
  private int mFontStyle;
  private int mFontWeight;
  private @Nullable String mFontFamily;

  // whether or not mutation is allowed.
  private boolean mFrozen;

  FontStylingSpan() {
  }

  private FontStylingSpan(
      double textColor,
      int backgroundColor,
      int fontSize,
      int fontStyle,
      int fontWeight,
      boolean hasUnderline,
      boolean hasStrikeThrough,
      @Nullable String fontFamily,
      boolean frozen) {
    mTextColor = textColor;
    mBackgroundColor = backgroundColor;
    mFontSize = fontSize;
    mFontStyle = fontStyle;
    mFontWeight = fontWeight;
    mHasUnderline = hasUnderline;
    mHasStrikeThrough = hasStrikeThrough;
    mFontFamily = fontFamily;
    mFrozen = frozen;
  }

  /* package */ FontStylingSpan mutableCopy() {
    return new FontStylingSpan(
        mTextColor,
        mBackgroundColor,
        mFontSize,
        mFontStyle,
        mFontWeight,
        mHasUnderline,
        mHasStrikeThrough,
        mFontFamily,
        false);
  }

  /* package */ boolean isFrozen() {
    return mFrozen;
  }

  /* package */ void freeze() {
    mFrozen = true;
  }

  /* package */ double getTextColor() {
    return mTextColor;
  }

  /* package */ void setTextColor(double textColor) {
    mTextColor = textColor;
  }

  /* package */ int getBackgroundColor() {
    return mBackgroundColor;
  }

  /* package */ void setBackgroundColor(int backgroundColor) {
    mBackgroundColor = backgroundColor;
  }

  /* package */ int getFontSize() {
    return mFontSize;
  }

  /* package */ void setFontSize(int fontSize) {
    mFontSize = fontSize;
  }

  /* package */ int getFontStyle() {
    return mFontStyle;
  }

  /* package */ void setFontStyle(int fontStyle) {
    mFontStyle = fontStyle;
  }

  /* package */ int getFontWeight() {
    return mFontWeight;
  }

  /* package */ void setFontWeight(int fontWeight) {
    mFontWeight = fontWeight;
  }

  /* package */ @Nullable String getFontFamily() {
    return mFontFamily;
  }

  /* package */ void setFontFamily(@Nullable String fontFamily) {
    mFontFamily = fontFamily;
  }

  /* package */ boolean hasUnderline() {
    return mHasUnderline;
  }

  /* package */ void setHasUnderline(boolean hasUnderline) {
    mHasUnderline = hasUnderline;
  }

  /* package */ boolean hasStrikeThrough() {
    return mHasStrikeThrough;
  }

  /* package */ void setHasStrikeThrough(boolean hasStrikeThrough) {
    mHasStrikeThrough = hasStrikeThrough;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    if (!Double.isNaN(mTextColor)) {
      ds.setColor((int) mTextColor);
    }

    ds.bgColor = mBackgroundColor;
    ds.setUnderlineText(mHasUnderline);
    ds.setStrikeThruText(mHasStrikeThrough);
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
