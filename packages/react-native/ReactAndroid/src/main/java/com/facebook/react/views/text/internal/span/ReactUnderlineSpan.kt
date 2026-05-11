/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Canvas
import android.graphics.Color
import android.os.Build
import android.text.Layout
import com.facebook.react.views.text.TextDecorationStyle
import com.facebook.react.views.text.drawDecorationLine
import kotlin.math.max

/**
 * Draws an underline whose color may differ from the text color and
 * whose stroke style may be `solid`, `double`, `dotted`, or `dashed`.
 * Subclasses [DrawCommandSpan] so [PreparedLayoutTextView] invokes
 * [onDraw] after the layout renders its text, ensuring the underline
 * paints on top of any descenders. We do NOT extend
 * [android.text.style.UnderlineSpan] here: the framework's `Layout.draw`
 * reads `paint.color` for the underline color regardless of
 * `paint.underlineColor`, so the only way to get a distinct underline
 * color (or style) is to draw it ourselves.
 *
 * When [color] is [Color.TRANSPARENT] (the default when no
 * `textDecorationColor` prop was passed), the underline is drawn in the
 * text's foreground color, matching the platform's prior behavior.
 */
internal class ReactUnderlineSpan(
    private val color: Int = Color.TRANSPARENT,
    private val style: TextDecorationStyle = TextDecorationStyle.SOLID,
) : DrawCommandSpan() {

  override fun onDraw(start: Int, end: Int, canvas: Canvas, layout: Layout) {
    val paint = layout.paint
    val savedColor = paint.color
    val savedStrokeWidth = paint.strokeWidth
    val savedStyle = paint.style
    val savedAntiAlias = paint.isAntiAlias
    val effectiveColor = if (color != Color.TRANSPARENT) color else savedColor
    // Density-aware minimum so the underline reads consistently across
    // display densities. `paint.density` is the px-per-dp ratio at the
    // current paint setup, so `1.5f * paint.density` gives ~1.5 dp.
    val minThickness = 1.5f * paint.density
    val thickness =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          max(paint.underlineThickness, minThickness)
        } else {
          max(paint.fontMetrics.descent * 0.1f, minThickness)
        }

    paint.color = effectiveColor
    paint.strokeWidth = thickness
    paint.style = android.graphics.Paint.Style.STROKE
    paint.isAntiAlias = true

    val startLine = layout.getLineForOffset(start)
    val endLine = layout.getLineForOffset(end)
    for (line in startLine..endLine) {
      val baseline = layout.getLineBaseline(line).toFloat()
      val x1 =
          if (line == startLine) layout.getPrimaryHorizontal(start) else layout.getLineLeft(line)
      val x2 =
          if (line == endLine) layout.getPrimaryHorizontal(end) else layout.getLineRight(line)
      val y = baseline + thickness + 1f
      drawDecorationLine(canvas, paint, x1, x2, y, thickness, style)
    }

    paint.color = savedColor
    paint.strokeWidth = savedStrokeWidth
    paint.style = savedStyle
    paint.isAntiAlias = savedAntiAlias
  }
}
