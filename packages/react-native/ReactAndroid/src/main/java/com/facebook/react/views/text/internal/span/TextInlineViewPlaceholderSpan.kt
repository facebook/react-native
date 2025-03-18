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
public class TextInlineViewPlaceholderSpan(
    public val reactTag: Int,
    public val width: Int,
    public val height: Int
) : ReplacementSpan(), ReactSpan {
  public override fun getSize(
      paint: Paint,
      text: CharSequence?,
      start: Int,
      end: Int,
      fm: FontMetricsInt?
  ): Int {
    // NOTE: This getSize code is copied from DynamicDrawableSpan and modified to not use a Drawable
    if (fm != null) {
      // Normal text has both ascent (above baseline) and descent (below baseline)
      // We need to divide our height to account for this natural text behavior
      
      // Get existing text metrics if available
      val originalAscent = fm.ascent
      val originalDescent = fm.descent
      
      // If we have valid metrics, use them as a guide
      if (originalAscent < 0 && originalDescent > 0) {
        // Calculate what portion of our height should be above vs below baseline
        // using the text's own metrics as a guide
        val totalTextHeight = -originalAscent + originalDescent
        val ratio = if (totalTextHeight > 0) {
          -originalAscent.toFloat() / totalTextHeight
        } else {
          0.8f // Default to 80% above baseline if we can't determine from text
        }
        
        // Apply this ratio to our height
        fm.ascent = (-height * ratio).toInt()
        fm.descent = (height * (1 - ratio)).toInt()
      } else {
        // Fallback if we don't have good metrics
        // Position 80% above baseline, 20% below - this matches typical text proportions
        fm.ascent = (-height * 0.8f).toInt()
        fm.descent = (height * 0.2f).toInt()
      }
      
      fm.top = fm.ascent
      fm.bottom = fm.descent
    }
    return width
  }

  public override fun draw(
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
