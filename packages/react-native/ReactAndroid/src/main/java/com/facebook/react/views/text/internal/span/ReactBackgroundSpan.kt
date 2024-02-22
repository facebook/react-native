package com.facebook.react.views.text.internal.span

import android.graphics.Canvas
import android.graphics.Typeface
import android.text.Layout
import android.text.Spanned
import android.widget.TextView
import androidx.core.graphics.withTranslation
import com.facebook.react.views.text.findEffectiveTypeface

public interface ReactBackgroundSpan : ReactSpan {
  public companion object {
    @JvmStatic
    public fun drawBackground(
      textView: TextView,
      canvas: Canvas,
    ) {
      val text = textView.text
      val layout = textView.layout

      if (text is Spanned && layout != null) {
        val spans = text.getSpans(0, text.length, ReactBackgroundSpan::class.java)

        for (span in spans) {
          val spanStart = text.getSpanStart(span)
          val spanEnd = text.getSpanEnd(span)

          val effectiveTypeface: Typeface = textView.findEffectiveTypeface(
            fontFamily = span.fontFamily,
            fontStyle = span.fontStyle,
            fontWeight = span.fontWeight,
          )

          canvas.withTranslation(
            x = textView.totalPaddingLeft.toFloat(),
            y = textView.totalPaddingTop.toFloat(),
          ) {
            span.draw(
              canvas = this,
              layout = layout,
              start = spanStart,
              end = spanEnd,
              effectiveTypeface = effectiveTypeface,
            )
          }
        }
      }
    }
  }

  public val fontFamily: String?

  public val fontStyle: Int

  public val fontWeight: Int

  public fun draw(
    canvas: Canvas,
    layout: Layout,
    start: Int,
    end: Int,
    effectiveTypeface: Typeface,
  )
}
