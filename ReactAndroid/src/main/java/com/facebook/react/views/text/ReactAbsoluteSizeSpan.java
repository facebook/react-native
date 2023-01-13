/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.graphics.Rect;
import android.text.TextPaint;
import android.text.style.AbsoluteSizeSpan;
import androidx.annotation.Nullable;

/*
 * Wraps {@link AbsoluteSizeSpan} as a {@link ReactSpan}.
 */
public class ReactAbsoluteSizeSpan extends AbsoluteSizeSpan implements ReactSpan {
  private static final String TAG = "ReactAbsoluteSizeSpan";
  private final String mText;
  private String mTextAlignVertical = "center-child";

  public ReactAbsoluteSizeSpan(
      int size, @Nullable String textAlignVertical, @Nullable String text) {
    super(size);
    mTextAlignVertical = textAlignVertical;
    mText = text;
  }

  @Override
  public void updateMeasureState(TextPaint tp) {
    updateDrawState(tp);
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    super.updateDrawState(ds);
    // if lineHeight is not set, align the text using the font metrics
    // works only with single line
    // https://stackoverflow.com/a/27631737/7295772
    // top      -------------  -26
    // ascent   -------------  -30
    // baseline __my Text____   0
    // descent  _____________   8
    // bottom   _____________   1
    if (mText != null) {
      Rect bounds = new Rect();
      ds.getTextBounds(mText, 0, mText.length(), bounds);
      if (mTextAlignVertical == "top-child") {
        ds.baselineShift += ds.getFontMetrics().top - ds.ascent() - ds.descent();
      }
      if (mTextAlignVertical == "bottom-child") {
        ds.baselineShift += ds.getFontMetrics().bottom - ds.descent();
      }
    }
  }
}
