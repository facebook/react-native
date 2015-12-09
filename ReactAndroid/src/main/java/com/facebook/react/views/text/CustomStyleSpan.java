/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import android.graphics.Paint;
import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;
import android.util.Pair;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

public class CustomStyleSpan extends MetricAffectingSpan {

  // Typeface caching is a bit weird: once a Typeface is created, it cannot be changed, so we need
  // to cache each font family and each style that they have. Typeface does cache this already in
  // Typeface.create(Typeface, style) post API 16, but for that you already need a Typeface.
  // Therefore, here we cache one style for each font family, and let Typeface cache all styles for
  // that font family. Of course this is not ideal, and especially after adding Typeface loading
  // from assets, we will need to have our own caching mechanism for all Typeface creation types.
  // TODO: t6866343 add better Typeface caching
  private static final Map<Pair<String, Integer>, Typeface> sTypefaceCache =
          new HashMap<Pair<String, Integer>, Typeface>();

  private final int mStyle;
  private final int mWeight;
  private final @Nullable String mFontFamily;

  public CustomStyleSpan(int fontStyle, int fontWeight, @Nullable String fontFamily) {
    mStyle = fontStyle;
    mWeight = fontWeight;
    mFontFamily = fontFamily;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    apply(ds, mStyle, mWeight, mFontFamily);
  }

  @Override
  public void updateMeasureState(TextPaint paint) {
    apply(paint, mStyle, mWeight, mFontFamily);
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

  private static void apply(Paint paint, int style, int weight, @Nullable String family) {
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
      typeface = getCachedTypeface(family, want);
    }

    if (typeface != null) {
      paint.setTypeface(typeface);
    } else {
      paint.setTypeface(Typeface.defaultFromStyle(want));
    }
  }

  private static Typeface getCachedTypeface(String family, int style) {
    Pair<String, Integer> key = Pair.create(family, style);
    if (sTypefaceCache.get(key) != null) {
      return sTypefaceCache.get(key);
    }

    key = Pair.create(family, Typeface.NORMAL);
    if (sTypefaceCache.get(key) != null) {
      return sTypefaceCache.get(key);
    }

    return null;
  }

  public static void addCustomTypeface(String family, int style, Typeface typeface) {
    sTypefaceCache.put(Pair.create(family, style), typeface);
  }
}
