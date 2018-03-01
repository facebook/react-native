/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import android.os.Build;
import android.text.SpannableStringBuilder;
import android.util.TypedValue;
import android.widget.EditText;

/** Local state bearer for EditText instance. */
public final class ReactTextInputLocalData {

  private final SpannableStringBuilder mText;
  private final float mTextSize;
  private final int mMinLines;
  private final int mMaxLines;
  private final int mInputType;
  private final int mBreakStrategy;

  public ReactTextInputLocalData(EditText editText) {
    mText = new SpannableStringBuilder(editText.getText());
    mTextSize = editText.getTextSize();
    mMinLines = editText.getMinLines();
    mMaxLines = editText.getMaxLines();
    mInputType = editText.getInputType();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      mBreakStrategy = editText.getBreakStrategy();
    } else {
      mBreakStrategy = 0;
    }
  }

  public void apply(EditText editText) {
    editText.setText(mText);
    editText.setTextSize(TypedValue.COMPLEX_UNIT_PX, mTextSize);
    editText.setMinLines(mMinLines);
    editText.setMaxLines(mMaxLines);
    editText.setInputType(mInputType);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      editText.setBreakStrategy(mBreakStrategy);
    }
  }
}
