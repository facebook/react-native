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
 * Wraps {@link AbsoluteSizeSpan} as a {@link ReactSpan}.
 */
public class ReactAbsoluteSizeSpan extends AbsoluteSizeSpan implements ReactSpan {
  private static final String TAG = "ReactAbsoluteSizeSpan";
  private TextAlignVertical mTextAlignVertical = TextAlignVertical.CENTER;
  private int mHighestLineHeight = 0;
  private int mHighestFontSize = 0;

  public enum TextAlignVertical {
    TOP,
    BOTTOM,
    CENTER,
  }

  public ReactAbsoluteSizeSpan(int size) {
    super(size);
  }

  public ReactAbsoluteSizeSpan(int size, TextAlignVertical textAlignVertical) {
    this(size);
    mTextAlignVertical = textAlignVertical;
  }

  @Override
  public void updateDrawState(TextPaint tp) {
    super.updateDrawState(tp);
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
        tp.baselineShift += tp.getFontMetrics().top - tp.ascent() - tp.descent();
      }
      if (mTextAlignVertical == TextAlignVertical.BOTTOM) {
        tp.baselineShift += tp.getFontMetrics().bottom - tp.descent();
      }
    } else {
      if (mHighestFontSize == getSize()) {
        // aligns text vertically in the lineHeight
        // and adjust their position depending on the fontSize
        if (mTextAlignVertical == TextAlignVertical.TOP) {
          tp.baselineShift -= mHighestLineHeight / 2 - getSize() / 2;
        }
        if (mTextAlignVertical == TextAlignVertical.BOTTOM) {
          tp.baselineShift += mHighestLineHeight / 2 - getSize() / 2 - tp.descent();
        }
      } else if (mHighestFontSize != 0) {
        // aligns correctly text that has smaller font
        if (mTextAlignVertical == TextAlignVertical.TOP) {
          tp.baselineShift -=
              mHighestLineHeight / 2
                  - mHighestFontSize / 2
                  // smaller font aligns on the baseline of bigger font
                  // moves the baseline of text with smaller font up
                  // so it aligns on the top of the larger font
                  + (mHighestFontSize - getSize())
                  + (tp.getFontMetrics().top - tp.ascent());
        }
        if (mTextAlignVertical == TextAlignVertical.BOTTOM) {
          tp.baselineShift += mHighestLineHeight / 2 - mHighestFontSize / 2 - tp.descent();
        }
      }
    }
  }

  public void updateSpan(int highestLineHeight, int highestFontSize) {
    mHighestLineHeight = highestLineHeight;
    mHighestFontSize = highestFontSize;
  }
}
