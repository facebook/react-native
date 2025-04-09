/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Paint.FontMetricsInt
import android.text.style.ReplacementSpan

/**
 * TextInlineViewPlaceholderSpan is a span for inlined views that are inside <Text></Text>. It
 * computes its size based on the input size. It contains no draw logic, just positioning logic.
 */
internal class TextInlineViewPlaceholderSpan(val reactTag: Int, val width: Int, val height: Int) :
    ReplacementSpan(), ReactSpan {
  override fun getSize(
      paint: Paint,
      text: CharSequence?,
      start: Int,
      end: Int,
      fm: FontMetricsInt?
  ): Int {
    // NOTE: This getSize code is copied from DynamicDrawableSpan and modified to not use a Drawable
    if (fm != null) {
      fm.ascent = -height
      fm.descent = 0
      fm.top = fm.ascent
      fm.bottom = 0
    }
    return width
  }

  override fun draw(
      canvas: Canvas,
      text: CharSequence?,
      start: Int,
      end: Int,
      x: Float,
      top: Int,
      y: Int,
      bottom: Int,
      paint: Paint
  ): Unit = Unit
}
