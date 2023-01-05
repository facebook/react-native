/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.graphics.Rect;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;

/** ratio 0 for center ratio 0.4 for top ratio */
public class ReactAlignSpan extends MetricAffectingSpan implements ReactSpan {
  private static final String TAG = "ReactAlignSpan";
  private final String mCurrentText;
  private double mLineHeight = -1;
  private Integer mParentHeight;
  private String mTextAlignVertical;
  private Integer mParentGravity;
  private int mParentLineCount;
  private int mCurrentLine;
  private float mCalculatedHeight;
  private int mMaximumLineHeight = 0;
  private int mOtherSpanLineHeight;
  private int mCurrentLineHeight;
  private int mImageLineHeight;
  private int mHighestLineHeight;

  ReactAlignSpan(String textAlignVertical, Float lineHeight, String currentText) {
    mTextAlignVertical = textAlignVertical;
    mLineHeight = lineHeight;
    mCurrentText = currentText;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    if (mTextAlignVertical == null) {
      return;
    }

    Rect bounds = new Rect();
    ds.getTextBounds(mCurrentText, 0, mCurrentText.length(), bounds);
    if (mTextAlignVertical == "top-child") {
      if (mHighestLineHeight != -1) {
        // the span with the highest lineHeight over-rides sets the height for all rows
        ds.baselineShift -= mHighestLineHeight / 2 - ds.getTextSize() / 2;
      } else {
        // if lineHeight is not set, align the text using the font
        // top and ascent https://stackoverflow.com/a/27631737/7295772
        ds.baselineShift -= bounds.top - ds.getFontMetrics().ascent;
      }
    }
    if (mTextAlignVertical == "center-child") {
      //
    }
    if (mTextAlignVertical == "bottom-child") {
      //
    }
  }

  // review types (float or int)
  public void updateSpan(
      Integer height,
      int gravity,
      int lineCount,
      float calculatedHeight,
      int currentLine,
      int imageLineHeight,
      int highestLineHeight) {
    mParentHeight = height;
    mParentGravity = gravity;
    mParentLineCount = lineCount;
    mCalculatedHeight = calculatedHeight;
    mCurrentLine = currentLine;
    mImageLineHeight = imageLineHeight;
    mHighestLineHeight = highestLineHeight;
  }

  @Override
  public void updateMeasureState(TextPaint tp) {
    updateDrawState(tp);
  }
}
