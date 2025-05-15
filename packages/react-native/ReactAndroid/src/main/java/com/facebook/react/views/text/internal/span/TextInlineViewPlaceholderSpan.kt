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
      // Get the parent text's font metrics
      val metrics = paint.fontMetricsInt
      
      if (metrics.ascent < 0 && metrics.descent > 0) {
        // Calculate the text height
        val textHeight = -metrics.ascent + metrics.descent
        
        // Find the vertical center of the text
        val textMiddle = metrics.ascent + textHeight / 2
        
        // Apply a moderate upward adjustment
        val adjustment = (textHeight * TEXT_MIDDLE_ADJUSTMENT_FACTOR).toInt()
        val adjustedMiddle = textMiddle - adjustment
        
        // Center the view on the adjusted middle point
        val halfViewHeight = height / 2
        
        fm.ascent = adjustedMiddle - halfViewHeight
        fm.descent = adjustedMiddle + halfViewHeight
        
        // Make sure top/bottom match ascent/descent
        fm.top = fm.ascent
        fm.bottom = fm.descent
      } 
      // Fallback to improved vertical centering if metrics aren't valid
      else {
        // Use defined ratios and adjustment factors
        val upwardAdjustment = height * FALLBACK_UPWARD_ADJUSTMENT_FACTOR
        
        fm.ascent = -(height * FALLBACK_ABOVE_BASELINE_RATIO + upwardAdjustment).toInt()
        fm.descent = (height * (1 - FALLBACK_ABOVE_BASELINE_RATIO)).toInt() // Or a new FALLBACK_BELOW_BASELINE_RATIO
        fm.top = fm.ascent
        fm.bottom = fm.descent
      }
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
