/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.TextPaint
import android.text.style.MetricAffectingSpan

/**
 * A [MetricAffectingSpan] that allows to set the letter spacing on the selected text span.
 *
 * The letter spacing is specified in pixels, which are converted to ems at paint time; this span
 * must therefore be applied after any spans affecting font size.
 */
public class CustomLetterSpacingSpan(public val spacing: Float) : MetricAffectingSpan(), ReactSpan {
  public override fun updateDrawState(paint: TextPaint) {
    apply(paint)
  }

  public override fun updateMeasureState(paint: TextPaint) {
    apply(paint)
  }

  private fun apply(paint: TextPaint) {
    if (!spacing.isNaN()) {
      paint.letterSpacing = spacing
    }
  }
}
