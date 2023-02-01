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
import android.text.style.UnderlineSpan;
import android.text.style.UpdateAppearance;
import androidx.annotation.NonNull;

/*
 * Wraps {@link UnderlineSpan} as a {@link ReactSpan}.
 */
public class ReactUnderlineSpan extends CharacterStyle implements ReactSpan, UpdateAppearance {
  private UnderlineSpan mSpan;

  ReactUnderlineSpan() {
    mSpan = new UnderlineSpan();
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
