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
  private String mTextAlignVertical = "center-child";
  private int mHighestLineHeight = 0;

  public ReactAbsoluteSizeSpan(int size) {
    super(size);
  }

  public ReactAbsoluteSizeSpan(int size, @Nullable String textAlignVertical) {
    super(size);
    mTextAlignVertical = textAlignVertical;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    super.updateDrawState(ds);
    // aligns text vertically in lineHeight
    if (ds.getTextSize() != 0 && mHighestLineHeight != 0) {
      if (mTextAlignVertical == "top-child") {
        ds.baselineShift -= mHighestLineHeight / 2 - getSize() / 2;
      }
      if (mTextAlignVertical == "bottom-child") {
        ds.baselineShift += mHighestLineHeight / 2 - getSize() / 2;
      }
    }
    // align the text by font metrics
    // https://stackoverflow.com/a/27631737/7295772
    // top      -------------  -26
    // ascent   -------------  -30
    // baseline __my Text____   0
    // descent  _____________   8
    // bottom   _____________   1
    if (mTextAlignVertical == "top-child") {
      ds.baselineShift += ds.getFontMetrics().top - ds.ascent() - ds.descent();
    }
    if (mTextAlignVertical == "bottom-child") {
      ds.baselineShift += ds.getFontMetrics().bottom - ds.descent();
    }
  }

  public void updateSpan(int highestLineHeight) {
    mHighestLineHeight = highestLineHeight;
  }
}
