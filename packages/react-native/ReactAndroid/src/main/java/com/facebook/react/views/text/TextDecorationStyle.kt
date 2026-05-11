/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Canvas
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
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
      Log.d(
          "ReactWavyDecoration",
          "wavelength=$wavelength cpDistance=$cpDistance thickness=$thickness x1=$x1 x2=$x2 y=$y")
      val path = Path()
      path.moveTo(x1, y)
      var x = x1
      while (x + wavelength <= x2) {
        val cp1x = x + wavelength / 2f
        val cp2x = x + wavelength / 2f
        val endX = x + wavelength
        // Two control points at the midpoint, one above (y - cp) and
        // one below (y + cp). Produces an oscillating S-curve per
        // wavelength, matching Chromium/Blink's wavy underline.
        path.cubicTo(cp1x, y + cpDistance, cp2x, y - cpDistance, endX, y)
        x = endX
      }
      canvas.drawPath(path, paint)
    }
  }
}
