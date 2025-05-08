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
        
        // Apply a moderate upward adjustment (7% of text height)
        // This is enough to make a visual difference without breaking layout
        val adjustment = (textHeight * 0.07f).toInt()
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
        // 60/40 split with a moderate upward adjustment
        val aboveRatio = 0.6f  // 60% above baseline
        val upwardAdjustment = height * 0.07f  // 7% upward shift 
        
        fm.ascent = -(height * aboveRatio + upwardAdjustment).toInt()
        fm.descent = (height * (1 - aboveRatio)).toInt()
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
