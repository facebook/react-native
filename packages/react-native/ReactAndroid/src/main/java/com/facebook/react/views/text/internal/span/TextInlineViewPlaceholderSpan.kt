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
import kotlin.math.min
import kotlin.math.pow

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
      // Get the parent text's metrics if available
      val metrics = paint.fontMetricsInt
      
      if (metrics.ascent < 0 && metrics.descent > 0) {
        // Calculate the text height
        val textHeight = -metrics.ascent + metrics.descent
        
        // For nested text hierarchies, we need more precise alignment
        // Adjust for alignment in deeply nested text by applying a small correction
        // to better account for the parent text line's layout
        val textCenter = metrics.ascent + textHeight / 2
        
        // Add a small correction factor for deeply nested text
        // This helps compensate for accumulated style effects from parent texts
        val halfViewHeight = height / 2
        
        // Slight upward adjustment for deeply nested texts to prevent views
        // from appearing too low in complex text hierarchies
        val nestingAdjustment = min(textHeight * 0.05f, 2f) // Max 2px adjustment
        
        // Calculate the final position with the adjustment
        val adjustedCenter = textCenter - nestingAdjustment
        
        // Set metrics to center the view on the adjusted center
        fm.ascent = (adjustedCenter - halfViewHeight).toInt()
        fm.descent = (adjustedCenter + halfViewHeight).toInt()
        
        // Make sure top/bottom match ascent/descent
        fm.top = fm.ascent
        fm.bottom = fm.descent
      } 
      // Fallback to pre-existing line metrics
      else {
        // Default to a standard, balanced positioning (middle alignment)
        // Apply the same nesting adjustment here too
        fm.ascent = -height / 2 - 1 // Small adjustment to prevent views appearing too low
        fm.descent = height / 2 + 1
        fm.top = fm.ascent
        fm.bottom = fm.descent
      }
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
