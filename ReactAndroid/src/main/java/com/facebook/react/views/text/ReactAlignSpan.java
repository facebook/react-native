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
  private String mTextAlignVertical;
  private int mMaximumLineHeight = 0;
  private int mOtherSpanLineHeight;
  private int mCurrentLineHeight;
  private int mHighestLineHeight = -1;

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
        // works only with single line
        // if lineHeight is not set, align the text using the font metrics
        // https://stackoverflow.com/a/27631737/7295772
        // top      -------------  -26
        // ascent   -------------  -30
        // baseline __my Text____   0
        // descent  _____________   8
        // bottom   _____________   1
        ds.baselineShift -= bounds.top + bounds.bottom - ds.ascent();
      }
    }
    if (mTextAlignVertical == "bottom-child") {
      if (mHighestLineHeight != -1) {
        // the span with the highest lineHeight over-rides sets the height for all rows
        ds.baselineShift += mHighestLineHeight / 2 - ds.getTextSize() / 2;
      } else {
        // works only with single line
        // if lineHeight is not set, align the text using the font metrics
        // https://stackoverflow.com/a/27631737/7295772
        ds.baselineShift += ds.descent();
      }
    }
  }

  // review types (float or int)
  public void updateSpan(int highestLineHeight) {
    mHighestLineHeight = highestLineHeight;
  }

  @Override
  public void updateMeasureState(TextPaint tp) {
    updateDrawState(tp);
  }
}
