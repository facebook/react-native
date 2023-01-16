/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.TextPaint;
import android.text.style.AbsoluteSizeSpan;
import androidx.annotation.Nullable;

/*
 * Wraps {@link AbsoluteSizeSpan} as a {@link ReactSpan}.
 */
public class ReactAbsoluteSizeSpan extends AbsoluteSizeSpan implements ReactSpan {
  private static final String TAG = "ReactAbsoluteSizeSpan";
  private String mText = "";
  private String mTextAlignVertical = "center-child";
  private int mHighestLineHeight = 0;
  private int mHighestFontSize = 0;

  public ReactAbsoluteSizeSpan(int size) {
    super(size);
  }

  public ReactAbsoluteSizeSpan(int size, @Nullable String textAlignVertical) {
    super(size);
    mTextAlignVertical = textAlignVertical;
  }

  public ReactAbsoluteSizeSpan(int size, @Nullable String textAlignVertical, String text) {
    super(size);
    mTextAlignVertical = textAlignVertical;
    mText = text;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    super.updateDrawState(ds);
    if (mTextAlignVertical == "center-child") {
      return;
    }
    boolean lineHeightNotBasedOnFontSize = ds.getTextSize() != 0 && mHighestLineHeight != 0;
    if (!lineHeightNotBasedOnFontSize) {
      // align the text by font metrics
      // https://stackoverflow.com/a/27631737/7295772
      if (mTextAlignVertical == "top-child") {
        ds.baselineShift += ds.getFontMetrics().top - ds.ascent() - ds.descent();
      }
      if (mTextAlignVertical == "bottom-child") {
        ds.baselineShift += ds.getFontMetrics().bottom - ds.descent();
      }
    }
    if (lineHeightNotBasedOnFontSize && mHighestFontSize == getSize()) {
      // aligns text vertically in the lineHeight
      if (mTextAlignVertical == "top-child") {
        ds.baselineShift -= mHighestLineHeight / 2 - getSize() / 2;
      }
      if (mTextAlignVertical == "bottom-child") {
        ds.baselineShift += mHighestLineHeight / 2 - getSize() / 2 - ds.descent();
      }
    } else if (lineHeightNotBasedOnFontSize && mHighestFontSize != 0) {
      // align correctly text that has smaller font
      if (mTextAlignVertical == "top-child") {
        ds.baselineShift -=
            mHighestLineHeight / 2
                - mHighestFontSize / 2
                + (mHighestFontSize - getSize())
                + (ds.getFontMetrics().top - ds.getFontMetrics().ascent);
      }
      if (mTextAlignVertical == "bottom-child") {
        ds.baselineShift += mHighestLineHeight / 2 - mHighestFontSize / 2 - ds.descent();
      }
    }
  }

  public void updateSpan(int highestLineHeight, int highestFontSize) {
    mHighestLineHeight = highestLineHeight;
    mHighestFontSize = highestFontSize;
  }
}
