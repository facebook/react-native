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
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.TextUtils;

import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ViewProps;

/**
 * RCTVirtualText is a {@link FlatTextShadowNode} that can contain font styling information.
 */
/* package */ class RCTVirtualText extends FlatTextShadowNode {

  private static final String BOLD = "bold";
  private static final String ITALIC = "italic";
  private static final String NORMAL = "normal";

  private FontStylingSpan mFontStylingSpan = new FontStylingSpan();

  // these 2 are only used between collectText() and applySpans() calls.
  private int mTextBegin;
  private int mTextEnd;

  RCTVirtualText() {
    mFontStylingSpan.setFontSize(getDefaultFontSize());
  }

  @Override
  protected void collectText(SpannableStringBuilder builder) {
    int childCount = getChildCount();

    mTextBegin = builder.length();
    for (int i = 0; i < childCount; ++i) {
      FlatTextShadowNode child = (FlatTextShadowNode) getChildAt(i);
      child.collectText(builder);
    }
    mTextEnd = builder.length();
  }

  @Override
  protected void applySpans(SpannableStringBuilder builder) {
    if (mTextBegin == mTextEnd) {
      return;
    }

    mFontStylingSpan.freeze();

    builder.setSpan(
        mFontStylingSpan,
        mTextBegin,
        mTextEnd,
        Spannable.SPAN_INCLUSIVE_EXCLUSIVE);

    int childCount = getChildCount();

    for (int i = 0; i < childCount; ++i) {
      FlatTextShadowNode child = (FlatTextShadowNode) getChildAt(i);
      child.applySpans(builder);
    }
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = Float.NaN)
  public void setFontSize(float fontSizeSp) {
    final int fontSize;
    if (Float.isNaN(fontSizeSp)) {
      fontSize = getDefaultFontSize();
    } else {
      fontSize = fontSizeFromSp(fontSizeSp);
    }

    if (mFontStylingSpan.getFontSize() != fontSize) {
      getSpan().setFontSize(fontSize);
      notifyChanged(true);
    }
  }

  @ReactProp(name = ViewProps.COLOR, defaultDouble = Double.NaN)
  public void setColor(double textColor) {
    if (mFontStylingSpan.getTextColor() != textColor) {
      getSpan().setTextColor(textColor);
      notifyChanged(false);
    }
  }

  @ReactProp(name = ViewProps.BACKGROUND_COLOR)
  public void setBackgroundColor(int backgroundColor) {
    if (mFontStylingSpan.getBackgroundColor() != backgroundColor) {
      getSpan().setBackgroundColor(backgroundColor);
      notifyChanged(false);
    }
  }

  @ReactProp(name = ViewProps.FONT_FAMILY)
  public void setFontFamily(@Nullable String fontFamily) {
    if (!TextUtils.equals(mFontStylingSpan.getFontFamily(), fontFamily)) {
      getSpan().setFontFamily(fontFamily);
      notifyChanged(true);
    }
  }

  @ReactProp(name = ViewProps.FONT_WEIGHT)
  public void setFontWeight(@Nullable String fontWeightString) {
    final int fontWeight;
    if (fontWeightString == null) {
      fontWeight = -1;
    } else if (BOLD.equals(fontWeightString)) {
      fontWeight = Typeface.BOLD;
    } else if (NORMAL.equals(fontWeightString)) {
      fontWeight = Typeface.NORMAL;
    } else {
      int fontWeightNumeric = parseNumericFontWeight(fontWeightString);
      if (fontWeightNumeric == -1) {
        throw new RuntimeException("invalid font weight " + fontWeightString);
      }
      fontWeight = fontWeightNumeric >= 500 ? Typeface.BOLD : Typeface.NORMAL;
    }

    if (mFontStylingSpan.getFontWeight() != fontWeight) {
      getSpan().setFontWeight(fontWeight);
      notifyChanged(true);
    }
  }

  @ReactProp(name = ViewProps.FONT_STYLE)
  public void setFontStyle(@Nullable String fontStyleString) {
    final int fontStyle;
    if (fontStyleString == null) {
      fontStyle = -1;
    } else if (ITALIC.equals(fontStyleString)) {
      fontStyle = Typeface.ITALIC;
    } else if (NORMAL.equals(fontStyleString)) {
      fontStyle = Typeface.NORMAL;
    } else {
      throw new RuntimeException("invalid font style " + fontStyleString);
    }

    if (mFontStylingSpan.getFontStyle() != fontStyle) {
      getSpan().setFontStyle(fontStyle);
      notifyChanged(true);
    }
  }

  protected int getDefaultFontSize() {
    return -1;
  }

  /* package */ static int fontSizeFromSp(float sp) {
    return (int) Math.ceil(PixelUtil.toPixelFromSP(sp));
  }

  private FontStylingSpan getSpan() {
    if (mFontStylingSpan.isFrozen()) {
      mFontStylingSpan = mFontStylingSpan.mutableCopy();
    }
    return mFontStylingSpan;
  }

  /**
   * Return -1 if the input string is not a valid numeric fontWeight (100, 200, ..., 900), otherwise
   * return the weight.
   */
  private static int parseNumericFontWeight(String fontWeightString) {
    // This should be much faster than using regex to verify input and Integer.parseInt
    return fontWeightString.length() == 3 && fontWeightString.endsWith("00")
        && fontWeightString.charAt(0) <= '9' && fontWeightString.charAt(0) >= '1' ?
        100 * (fontWeightString.charAt(0) - '0') : -1;
  }
}
