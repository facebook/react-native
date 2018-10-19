/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.annotation.TargetApi;
import android.os.Build;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;

import com.facebook.infer.annotation.Assertions;

/**
 * A {@link MetricAffectingSpan} that allows to set the letter spacing
 * on the selected text span.
 * 
 * The letter spacing is specified in pixels, which are converted to
 * ems at paint time; this span must therefore be applied after any
 * spans affecting font size.
 */
@TargetApi(Build.VERSION_CODES.LOLLIPOP)
public class CustomLetterSpacingSpan extends MetricAffectingSpan {

  private final float mLetterSpacing;

  public CustomLetterSpacingSpan(float letterSpacing) {
    mLetterSpacing = letterSpacing;
  }

  @Override
  public void updateDrawState(TextPaint paint) {
    apply(paint);
  }

  @Override
  public void updateMeasureState(TextPaint paint) {
    apply(paint);
  }

  private void apply(TextPaint paint) {
    // mLetterSpacing and paint.getTextSize() are both in pixels,
    // yielding an accurate em value.
    if (!Float.isNaN(mLetterSpacing)) {
      paint.setLetterSpacing(mLetterSpacing / paint.getTextSize());
    }
  }
}
