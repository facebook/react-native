/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.text.style.ReplacementSpan;

/**
 * TextInlineViewPlaceholderSpan is a span for inlined views that are inside <Text/>. It computes
 * its size based on the input size. It contains no draw logic, just positioning logic.
 */
public class TextInlineViewPlaceholderSpan extends ReplacementSpan implements ReactSpan {
  private int mReactTag;
  private int mWidth;
  private int mHeight;

  public TextInlineViewPlaceholderSpan(int reactTag, int width, int height) {
    mReactTag = reactTag;
    mWidth = width;
    mHeight = height;
  }

  public int getReactTag() {
    return mReactTag;
  }

  public int getWidth() {
    return mWidth;
  }

  public int getHeight() {
    return mHeight;
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
      Canvas canvas, CharSequence text, int start, int end, float x, int top, int y, int bottom, Paint paint) {
  }
}
