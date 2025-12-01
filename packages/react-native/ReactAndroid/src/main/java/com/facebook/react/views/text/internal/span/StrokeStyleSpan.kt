package com.facebook.react.views.text.internal.span

import android.graphics.Canvas
import android.graphics.Paint
import android.text.style.ReplacementSpan

/**
 * A span that applies text stroke styling with two-pass rendering.
 * First draws stroke, then draws fill on top to create outer stroke effect.
 */
public class StrokeStyleSpan(
    private val strokeWidth: Float,
    private val strokeColor: Int
) : ReplacementSpan(), ReactSpan {

  public override fun getSize(
      paint: Paint,
      text: CharSequence?,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?
  ): Int {
    val width = paint.measureText(text, start, end)

    if (fm != null) {
      paint.getFontMetricsInt(fm)
      val halfStroke = (strokeWidth / 2).toInt()
      fm.top -= halfStroke
      fm.ascent -= halfStroke
      fm.descent += halfStroke
      fm.bottom += halfStroke
    }

    return width.toInt()
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
  ) {
    if (text == null) return

    val textToDraw = text.subSequence(start, end).toString()
    val strokeInset = strokeWidth / 2

    // Store original paint settings
    val originalStyle = paint.style
    val originalColor = paint.color
    val originalStrokeWidth = paint.strokeWidth
    val originalStrokeJoin = paint.strokeJoin
    val originalStrokeCap = paint.strokeCap

    // First pass: Draw stroke only (solid color)
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = strokeWidth
    paint.strokeJoin = Paint.Join.ROUND
    paint.strokeCap = Paint.Cap.ROUND
    paint.color = strokeColor
    canvas.drawText(textToDraw, x + strokeInset, y.toFloat(), paint)

    // Second pass: Draw fill on top
    paint.style = Paint.Style.FILL
    paint.color = originalColor
    if (text is android.text.Spanned && paint is android.text.TextPaint) {
      val spans = text.getSpans(start, end, android.text.style.CharacterStyle::class.java)
      for (span in spans) {
        span.updateDrawState(paint)
      }
    }
    canvas.drawText(textToDraw, x + strokeInset, y.toFloat(), paint)

    // Restore original paint settings
    paint.style = originalStyle
    paint.color = originalColor
    paint.strokeWidth = originalStrokeWidth
    paint.strokeJoin = originalStrokeJoin
    paint.strokeCap = originalStrokeCap
  }
}
