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
import kotlin.math.max

/**
 * Draws a strikethrough whose color may differ from the text color. Subclasses
 * [DrawCommandSpan] so [PreparedLayoutTextView] and [ReactTextView] invoke
 * [onDraw] after the layout renders its text. We do NOT extend
 * [android.text.style.StrikethroughSpan] here: the framework's `Layout.draw`
 * paints the strikethrough using `paint.color` with no field to override,
 * so the only way to get a distinct color is to draw it ourselves.
 *
 * When [color] is [Color.TRANSPARENT] (the default when no
 * `textDecorationColor` prop was passed), the strikethrough is drawn in the
 * text's foreground color, matching the platform's prior behavior.
 */
internal class ReactStrikethroughSpan(private val color: Int = Color.TRANSPARENT) :
    DrawCommandSpan() {

  override fun onDraw(start: Int, end: Int, canvas: Canvas, layout: Layout) {
    val paint = layout.paint
    val savedColor = paint.color
    val savedStrokeWidth = paint.strokeWidth
    val savedStyle = paint.style
    val savedAntiAlias = paint.isAntiAlias
    val effectiveColor = if (color != Color.TRANSPARENT) color else savedColor
    val thickness =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          max(paint.underlineThickness, 1.5f)
        } else {
          max(paint.fontMetrics.descent * 0.1f, 1.5f)
        }

    paint.color = effectiveColor
    paint.strokeWidth = thickness
    paint.style = android.graphics.Paint.Style.STROKE
    paint.isAntiAlias = true

    // Position the strikethrough at the midpoint between the line's top
    // and baseline so it sits near the x-height midline like the platform
    // default. `fontMetrics.ascent` is negative and `descent` is positive,
    // so the sum / 2 gives a small negative offset from the baseline.
    val fm = paint.fontMetrics
    val offset = (fm.ascent + fm.descent) / 2f

    val startLine = layout.getLineForOffset(start)
    val endLine = layout.getLineForOffset(end)
    for (line in startLine..endLine) {
      val baseline = layout.getLineBaseline(line).toFloat()
      val x1 =
          if (line == startLine) layout.getPrimaryHorizontal(start) else layout.getLineLeft(line)
      val x2 =
          if (line == endLine) layout.getPrimaryHorizontal(end) else layout.getLineRight(line)
      val y = baseline + offset
      canvas.drawLine(x1, y, x2, y, paint)
    }

    paint.color = savedColor
    paint.strokeWidth = savedStrokeWidth
    paint.style = savedStyle
    paint.isAntiAlias = savedAntiAlias
  }
}
