/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;

/**
 * Instances of this class are used to place reactTag information of nested text react nodes into
 * spannable text rendered by single {@link TextView}
 */
public class ReactTopAlignSpan extends MetricAffectingSpan implements ReactSpan {
  double ratio = 0.4;

  public ReactTopAlignSpan() {}

  public ReactTopAlignSpan(double ratio) {
    this.ratio = ratio;
  }

  @Override
  public void updateDrawState(TextPaint paint) {
    paint.baselineShift += (int) (paint.ascent() * ratio);
  }

  @Override
  public void updateMeasureState(TextPaint paint) {
    paint.baselineShift += (int) (paint.ascent() * ratio);
  }
}
