// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.text;

import android.graphics.Paint;
import android.text.style.LineHeightSpan;

/**
 * We use a custom {@link LineHeightSpan}, because `lineSpacingExtra` is broken. Details here:
 * https://github.com/facebook/react-native/issues/7546
 */
public class CustomLineHeightSpan implements LineHeightSpan {
  private final float mHeight;

  CustomLineHeightSpan(float height) {
    this.mHeight = height;
  }

  @Override
  public void chooseHeight(
      CharSequence text,
      int start,
      int end,
      int spanstartv,
      int v,
      Paint.FontMetricsInt fm) {
    fm.ascent = fm.top = 0;
    fm.descent = fm.bottom = (int) Math.ceil(mHeight);
  }
}
