/*
 * Copyright (c) Discord, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Canvas
import android.graphics.Paint
import android.text.Spanned
import android.text.style.ReplacementSpan
import kotlin.math.max

/**
 * A span that applies text shadow with proper bounds calculation.
 * Extends ReplacementSpan to control measurement and drawing, ensuring shadows render correctly.
 * This is Discord's custom implementation that contains all shadow logic.
 */
public class DiscordShadowStyleSpan(
    private val dx: Float,
    private val dy: Float,
    private val radius: Float,
    private val color: Int
) : ReplacementSpan(), ReactSpan {

  // Getters for shadow properties (used by getShadowAdjustment)
  public fun getShadowRadius(): Float = radius
  public fun getShadowDx(): Float = dx

  override fun getSize(
      paint: Paint,
      text: CharSequence?,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?
  ): Int {
    val width = paint.measureText(text, start, end)

    if (fm != null) {
      paint.getFontMetricsInt(fm)

      val shadowTopNeeded = max(0f, radius - dy)
      val shadowBottomNeeded = max(0f, radius + dy)

      val topExpansion = shadowTopNeeded.toInt()
      val bottomExpansion = shadowBottomNeeded.toInt()

      // Adjust font metrics to account for shadow
      fm.top -= topExpansion
      fm.ascent -= topExpansion
      fm.descent += bottomExpansion
      fm.bottom += bottomExpansion
    }

    val shadowLeftNeeded = max(0f, radius - dx)
    val shadowRightNeeded = max(0f, radius + dx)

    // Subtract 1 pixel to prevent TextView ellipsization while keeping shadow mostly intact
    return (width + shadowLeftNeeded + shadowRightNeeded).toInt() - 1
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
  ) {
    if (text == null) return

    val textToDraw = text.subSequence(start, end).toString()

    // Offset text to keep shadow in positive coordinates
    val shadowLeftNeeded = max(0f, radius - dx)

    // Store original shadow settings
    val originalShadowRadius = paint.shadowLayerRadius
    val originalShadowDx = paint.shadowLayerDx
    val originalShadowDy = paint.shadowLayerDy
    val originalShadowColor = paint.shadowLayerColor

    paint.setShadowLayer(radius, dx, dy, color)

    if (text is Spanned && paint is android.text.TextPaint) {
      val spans = text.getSpans(start, end, android.text.style.CharacterStyle::class.java)
      for (span in spans) {
        if (span !is DiscordShadowStyleSpan) {
          span.updateDrawState(paint)
        }
      }
    }

    // Offset text by shadowLeftNeeded to keep shadow in positive coordinates
    // The view will compensate with canvas translation
    canvas.drawText(textToDraw, x + shadowLeftNeeded, y.toFloat(), paint)

    // Restore original shadow settings
    if (originalShadowRadius > 0f) {
      paint.setShadowLayer(
          originalShadowRadius, originalShadowDx, originalShadowDy, originalShadowColor)
    } else {
      paint.clearShadowLayer()
    }
  }

  /**
   * Result class for shadow adjustment calculation.
   * Contains the horizontal offset needed to compensate for shadow positioning
   * and whether a shadow is present.
   */
  public data class ShadowAdjustment(
      val leftOffset: Float,
      val hasShadow: Boolean
  ) {
    public companion object {
      @JvmStatic
      public val NONE: ShadowAdjustment = ShadowAdjustment(0f, false)
    }
  }

  public companion object {
    /**
     * Helper method for ReactTextView and PreparedLayoutTextView to get shadow adjustment values.
     * Calculates the horizontal offset needed to compensate for shadow positioning
     * when the span offsets text to keep shadows in positive coordinates.
     * 
     * @param spanned The text to check for shadow spans, or null if no text
     * @return ShadowAdjustment with negative leftOffset (ready to use in canvas.translate)
     */
    @JvmStatic
    public fun getShadowAdjustment(spanned: Spanned?): ShadowAdjustment {
      if (spanned == null) {
        return ShadowAdjustment.NONE
      }

      val spans = spanned.getSpans(0, spanned.length, DiscordShadowStyleSpan::class.java)
      if (spans.isEmpty()) {
        return ShadowAdjustment.NONE
      }

      // Use the first shadow span to calculate offset
      val span = spans[0]
      val radius = span.getShadowRadius()
      val dx = span.getShadowDx()
      // Return negative offset so views can use it directly in canvas.translate
      val shadowLeftOffset = -max(0f, radius - dx)

      return ShadowAdjustment(shadowLeftOffset, true)
    }
  }
}

