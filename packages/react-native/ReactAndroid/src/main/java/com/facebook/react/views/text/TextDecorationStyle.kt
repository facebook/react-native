/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
import android.os.Build
import android.text.Layout
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Styles supported by the CSS `text-decoration-style` property, surfaced
 * end-to-end by Fabric (see `TextAttributes::textDecorationStyle`).
 */
internal enum class TextDecorationStyle {
  SOLID,
  DOUBLE,
  DOTTED,
  DASHED,
  WAVY;

  internal companion object {
    @JvmStatic
    fun fromString(value: String?): TextDecorationStyle =
        when (value) {
          "double" -> DOUBLE
          "dotted" -> DOTTED
          "dashed" -> DASHED
          "wavy" -> WAVY
          else -> SOLID
        }
  }
}

/**
 * Draws a horizontal decoration line between `x1` and `x2` at `y`,
 * applying the requested CSS `text-decoration-style`. The caller is
 * expected to have already configured `paint.color`, `paint.strokeWidth`,
 * `paint.style = STROKE`, and `paint.isAntiAlias = true`, and to restore
 * those after the call returns. The `paint.pathEffect` is saved and
 * restored internally because dotted/dashed need to set it temporarily.
 *
 * Constants match Chromium/Blink's decoration_line_painter.cc so the
 * visual rendering is consistent with what users see in Chrome on
 * Android:
 *  - DOUBLE: center-to-center distance is `thickness + 1`.
 *  - WAVY: wavelength = `1 + 2 * round(2 * thickness + 0.5)`,
 *    controlPointDistance = `0.5 + round(3 * thickness + 0.5)`.
 *    One cubic Bezier per wavelength with both control points at the
 *    midpoint, one above and one below the y-axis.
 */
internal fun drawDecorationLine(
    canvas: Canvas,
    paint: Paint,
    x1: Float,
    x2: Float,
    y: Float,
    thickness: Float,
    style: TextDecorationStyle,
) {
  when (style) {
    TextDecorationStyle.SOLID -> canvas.drawLine(x1, y, x2, y, paint)
    TextDecorationStyle.DOUBLE -> {
      // Center-to-center distance such that the visible gap between the
      // top and bottom strokes (= gap - thickness) is 2 px regardless of
      // stroke width. Blink renders with a 1 px gap, but with
      // antialiasing that often reads as a single fat line; the wider
      // gap keeps both strokes legible.
      val gap = thickness + 2f
      canvas.drawLine(x1, y, x2, y, paint)
      canvas.drawLine(x1, y + gap, x2, y + gap, paint)
    }
    TextDecorationStyle.DOTTED,
    TextDecorationStyle.DASHED -> {
      val intervals =
          if (style == TextDecorationStyle.DOTTED) floatArrayOf(thickness, thickness * 2f)
          else floatArrayOf(thickness * 4f, thickness * 2f)
      val savedEffect = paint.pathEffect
      paint.pathEffect = DashPathEffect(intervals, 0f)
      // `Canvas.drawLine` ignores `pathEffect`; draw the line as a Path
      // so the dash intervals are honored.
      val path = Path()
      path.moveTo(x1, y)
      path.lineTo(x2, y)
      canvas.drawPath(path, paint)
      paint.pathEffect = savedEffect
    }
    TextDecorationStyle.WAVY -> {
      val clamped = max(1f, thickness)
      val wavelength = 1f + 2f * (2f * clamped + 0.5f).roundToInt()
      val cpDistance = 0.5f + (3f * clamped + 0.5f).roundToInt()
      val path = Path()
      path.moveTo(x1, y)
      var x = x1
      // Loop while `x < x2` (not `x + wavelength <= x2`) so the wave
      // continues through the final character (including trailing
      // punctuation). The last cycle may extend a hair past the run,
      // which reads as a natural underline trailer.
      while (x < x2) {
        val midX = x + wavelength / 2f
        val endX = x + wavelength
        // Two control points at the midpoint, one above (y - cp) and
        // one below (y + cp). Produces an oscillating S-curve per
        // wavelength, matching Chromium/Blink's wavy underline.
        path.cubicTo(midX, y + cpDistance, midX, y - cpDistance, endX, y)
        x = endX
      }
      canvas.drawPath(path, paint)
    }
  }
}

/**
 * Shared decoration drawing entry point used by [ReactUnderlineSpan] and
 * [ReactStrikethroughSpan]. Computes a density-aware stroke thickness,
 * sets up the paint, iterates the visible lines of the run, and delegates
 * each line to [drawDecorationLine]. The caller-supplied [yOffsetForLine]
 * computes the vertical position of the decoration line on each visible
 * line of text (underline vs strikethrough being the only difference).
 */
internal inline fun drawSpannedDecoration(
    start: Int,
    end: Int,
    canvas: Canvas,
    layout: Layout,
    color: Int,
    style: TextDecorationStyle,
    yOffsetForLine: (paint: Paint, baseline: Float, thickness: Float) -> Float,
) {
  val paint = layout.paint
  val savedColor = paint.color
  val savedStrokeWidth = paint.strokeWidth
  val savedStyle = paint.style
  val savedAntiAlias = paint.isAntiAlias
  val effectiveColor = if (color != Color.TRANSPARENT) color else savedColor
  // Density-aware minimum so the decoration reads consistently across
  // display densities (`paint.density` is the px-per-dp ratio).
  val minThickness = 1.5f * paint.density
  val thickness =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        max(paint.underlineThickness, minThickness)
      } else {
        max(paint.fontMetrics.descent * 0.1f, minThickness)
      }

  paint.color = effectiveColor
  paint.strokeWidth = thickness
  paint.style = Paint.Style.STROKE
  paint.isAntiAlias = true

  val startLine = layout.getLineForOffset(start)
  val endLine = layout.getLineForOffset(end)
  for (line in startLine..endLine) {
    val baseline = layout.getLineBaseline(line).toFloat()
    val x1 =
        if (line == startLine) layout.getPrimaryHorizontal(start) else layout.getLineLeft(line)
    val x2 = if (line == endLine) layout.getPrimaryHorizontal(end) else layout.getLineRight(line)
    val y = yOffsetForLine(paint, baseline, thickness)
    drawDecorationLine(canvas, paint, x1, x2, y, thickness, style)
  }

  paint.color = savedColor
  paint.strokeWidth = savedStrokeWidth
  paint.style = savedStyle
  paint.isAntiAlias = savedAntiAlias
}
