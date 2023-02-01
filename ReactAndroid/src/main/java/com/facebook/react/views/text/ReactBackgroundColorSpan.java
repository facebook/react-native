/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.ParcelableSpan;
import android.text.TextPaint;
import android.text.style.BackgroundColorSpan;
import android.text.style.CharacterStyle;
import android.text.style.UpdateAppearance;
import androidx.annotation.NonNull;

/*
 * Wraps {@link BackgroundColorSpan} as a {@link ReactSpan}.
 */
public class ReactBackgroundColorSpan extends CharacterStyle
    implements ReactSpan, UpdateAppearance {
  private BackgroundColorSpan mSpan;

  public ReactBackgroundColorSpan(int color) {
    mSpan = new BackgroundColorSpan(color);
  }

  @NonNull
  @Override
  public ParcelableSpan asParcelable() {
    return mSpan;
  }

  @Override
  public void updateDrawState(TextPaint textPaint) {
    mSpan.updateDrawState(textPaint);
  }
}
