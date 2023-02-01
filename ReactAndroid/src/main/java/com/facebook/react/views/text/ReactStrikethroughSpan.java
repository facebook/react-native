/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.ParcelableSpan;
import android.text.TextPaint;
import android.text.style.CharacterStyle;
import android.text.style.StrikethroughSpan;
import android.text.style.UpdateAppearance;
import androidx.annotation.NonNull;

/*
 * Wraps {@link StrikethroughSpan} as a {@link ReactSpan}.
 */
public class ReactStrikethroughSpan extends CharacterStyle implements ReactSpan, UpdateAppearance {
  private StrikethroughSpan mSpan;

  public ReactStrikethroughSpan() {
    mSpan = new StrikethroughSpan();
  }

  @Override
  public void updateDrawState(TextPaint textPaint) {
    mSpan.updateDrawState(textPaint);
  }

  @NonNull
  @Override
  public ParcelableSpan asParcelable() {
    return mSpan;
  }
}
