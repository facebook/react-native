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

import android.graphics.Paint;
import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;

public class CustomStyleSpan extends MetricAffectingSpan {
  private final TypefaceProvider mTypefaceProvider;
  private final int mStyle;
  private final int mWeight;
  private final @Nullable String mFontFamily;

  public CustomStyleSpan(TypefaceProvider typefaceProvider, int fontStyle, int fontWeight, @Nullable String fontFamily) {
    mTypefaceProvider = typefaceProvider;
    mStyle = fontStyle;
    mWeight = fontWeight;
    mFontFamily = fontFamily;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    apply(ds, mStyle, mWeight, mFontFamily, mTypefaceProvider);
  }

  @Override
  public void updateMeasureState(TextPaint paint) {
    apply(paint, mStyle, mWeight, mFontFamily, mTypefaceProvider);
  }

  /**
   * Returns {@link Typeface#NORMAL} or {@link Typeface#ITALIC}.
   */
  public int getStyle() {
    return (mStyle == ReactTextShadowNode.UNSET ? 0 : mStyle);
  }

  /**
   * Returns {@link Typeface#NORMAL} or {@link Typeface#BOLD}.
   */
  public int getWeight() {
    return (mWeight  == ReactTextShadowNode.UNSET ? 0 : mWeight);
  }

  /**
   * Returns the font family set for this StyleSpan.
   */
  public @Nullable String getFontFamily() {
    return mFontFamily;
  }

  private static void apply(Paint paint, int style, int weight, @Nullable String family, TypefaceProvider typefaceProvider) {
    int oldStyle;
    Typeface typeface = paint.getTypeface();
    if (typeface == null) {
      oldStyle = 0;
    } else {
      oldStyle = typeface.getStyle();
    }

    int want = 0;
    if ((weight == Typeface.BOLD) ||
        ((oldStyle & Typeface.BOLD) != 0 && weight == ReactTextShadowNode.UNSET)) {
      want |= Typeface.BOLD;
    }

    if ((style == Typeface.ITALIC) ||
        ((oldStyle & Typeface.ITALIC) != 0 && style == ReactTextShadowNode.UNSET)) {
      want |= Typeface.ITALIC;
    }

    if (family != null) {
      typeface = typefaceProvider.getOrCreateTypeface(family, want);
    }

    if (typeface != null) {
      paint.setTypeface(Typeface.create(typeface, want));
    } else {
      paint.setTypeface(Typeface.defaultFromStyle(want));
    }
  }
}
