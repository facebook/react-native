/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.text.Spanned
import android.text.TextPaint
import android.text.style.CharacterStyle

public class StrokeStyleSpan(
    public val width: Float,
    public val color: Int
) : CharacterStyle(), ReactSpan {

  override fun updateDrawState(textPaint: TextPaint) {
    // No-op - stroke drawing is handled by the view's onDraw
  }

  public fun hasStroke(): Boolean = width > 0 && color != 0

  public fun getLeftOffset(): Float = if (hasStroke()) width / 2f else 0f

  public fun draw(paint: Paint, drawCallback: Runnable): Boolean {
    if (!hasStroke()) {
      return false
    }

    val originalStyle = paint.style
    val originalStrokeWidth = paint.strokeWidth
    val originalStrokeJoin = paint.strokeJoin
    val originalStrokeCap = paint.strokeCap
    val originalColor = paint.color
    val originalColorFilter = paint.colorFilter

    // Stroke pass
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = width
    paint.strokeJoin = Paint.Join.ROUND
    paint.strokeCap = Paint.Cap.ROUND
    paint.colorFilter = PorterDuffColorFilter(color, PorterDuff.Mode.SRC_IN)
    drawCallback.run()

    // Fill pass
    paint.style = Paint.Style.FILL
    paint.strokeWidth = 0f
    paint.color = originalColor
    paint.colorFilter = originalColorFilter
    drawCallback.run()

    // Restore
    paint.style = originalStyle
    paint.strokeWidth = originalStrokeWidth
    paint.strokeJoin = originalStrokeJoin
    paint.strokeCap = originalStrokeCap
    paint.color = originalColor
    paint.colorFilter = originalColorFilter

    return true
  }

  public companion object {
    @JvmStatic
    public fun getStrokeSpan(spanned: Spanned?): StrokeStyleSpan? {
      if (spanned == null) return null
      val spans = spanned.getSpans(0, spanned.length, StrokeStyleSpan::class.java)
      return spans.firstOrNull()
    }
  }
}
