/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.TextPaint;
import android.text.style.AbsoluteSizeSpan;

/*
 * Uses {@link AbsoluteSizeSpan} to change text baseline based on fontSize and lineHeight {@link ReactSpan}.
 */
public class ReactAlignSpan extends AbsoluteSizeSpan implements ReactSpan {
  private static final String TAG = "ReactAlignSpan";
  private TextAlignVertical mTextAlignVertical = TextAlignVertical.CENTER;
  private int mHighestLineHeight = 0;
  private int mHighestFontSize = 0;

  public enum TextAlignVertical {
    TOP,
    BOTTOM,
    CENTER,
  }

  public ReactAlignSpan(int size) {
    super(size);
  }

  public ReactAlignSpan(int size, TextAlignVertical textAlignVertical) {
    this(size);
    mTextAlignVertical = textAlignVertical;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    super.updateDrawState(ds);
    if (mTextAlignVertical == TextAlignVertical.CENTER) {
      return;
    }
    if (mHighestLineHeight == 0) {
      // aligns the text by font metrics
      // when lineHeight prop is missing
      // https://stackoverflow.com/a/27631737/7295772
      // top      -------------  -10
      // ascent   -------------  -5
      // baseline __my Text____   0
      // descent  _____________   2
      // bottom   _____________   5
      if (mTextAlignVertical == TextAlignVertical.TOP) {
        ds.baselineShift += ds.getFontMetrics().top - ds.ascent() - ds.descent();
      }
      if (mTextAlignVertical == TextAlignVertical.BOTTOM) {
        ds.baselineShift += ds.getFontMetrics().bottom - ds.descent();
      }
    } else {
      if (mHighestFontSize == getSize()) {
        // aligns text vertically in the lineHeight
        // and adjust their position depending on the fontSize
        if (mTextAlignVertical == TextAlignVertical.TOP) {
          ds.baselineShift -= mHighestLineHeight / 2 - getSize() / 2;
        }
        if (mTextAlignVertical == TextAlignVertical.BOTTOM) {
          ds.baselineShift += mHighestLineHeight / 2 - getSize() / 2 - ds.descent();
        }
      } else if (mHighestFontSize != 0 && getSize() < mHighestFontSize) {
        // aligns correctly text that has smaller font
        if (mTextAlignVertical == TextAlignVertical.TOP) {
          ds.baselineShift -=
              mHighestLineHeight / 2
                  - mHighestFontSize / 2
                  // smaller font aligns on the baseline of bigger font
                  // moves the baseline of text with smaller font up
                  // so it aligns on the top of the larger font
                  + (mHighestFontSize - getSize())
                  + (ds.getFontMetrics().top - ds.ascent());
        }
        if (mTextAlignVertical == TextAlignVertical.BOTTOM) {
          ds.baselineShift += mHighestLineHeight / 2 - mHighestFontSize / 2 - ds.descent();
        }
      }
    }
  }

  public void updateSpan(int highestLineHeight, int highestFontSize) {
    mHighestLineHeight = highestLineHeight;
    mHighestFontSize = highestFontSize;
  }
}
