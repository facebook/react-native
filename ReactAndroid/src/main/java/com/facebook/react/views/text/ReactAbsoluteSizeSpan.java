/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.ParcelableSpan;
import android.text.TextPaint;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.MetricAffectingSpan;
import androidx.annotation.NonNull;

/*
 * Wraps {@link AbsoluteSizeSpan} as a {@link ReactSpan}.
 */
public class ReactAbsoluteSizeSpan extends MetricAffectingSpan implements ReactSpan {
  private AbsoluteSizeSpan mSpan;

  public ReactAbsoluteSizeSpan(int size) {
    mSpan = new AbsoluteSizeSpan(size);
  }

  public int getSize() {
    return mSpan.getSize();
  }

  @Override
  public void updateMeasureState(@NonNull TextPaint textPaint) {
    mSpan.updateMeasureState(textPaint);
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
