/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
 */
@TargetApi(Build.VERSION_CODES.LOLLIPOP)
public class CustomLetterSpacingSpan extends MetricAffectingSpan {

  private final float mLetterSpacing;

  public CustomLetterSpacingSpan(float letterSpacing) {
    Assertions.assertCondition(!Float.isNaN(letterSpacing) && letterSpacing != 0);
    mLetterSpacing = letterSpacing;
  }

  @Override
  public void updateDrawState(TextPaint paint) {
    paint.setLetterSpacing(mLetterSpacing);
  }

  @Override
  public void updateMeasureState(TextPaint paint) {
    paint.setLetterSpacing(mLetterSpacing);
  }
}
