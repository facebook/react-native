/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.graphics.Rect
import android.text.Layout
import android.text.TextPaint
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray

internal object FontMetricsUtil {

  private const val CAP_HEIGHT_MEASUREMENT_TEXT = "T"
  private const val X_HEIGHT_MEASUREMENT_TEXT = "x"
  private const val AMPLIFICATION_FACTOR = 100f

  @JvmStatic
  fun getFontMetrics(
      text: CharSequence,
      layout: Layout,
      paint: TextPaint,
      context: Context
  ): WritableArray {
    val dm = context.resources.displayMetrics
    val lines = Arguments.createArray()

    // To calculate xHeight and capHeight we have to render an "x" and "T" and manually measure
    // their height. In order to get more precision than Android offers, we blow up the text size by
    // 100 and
    // measure it. Luckily, text size affects rendering linearly, so we can do this trick.
    val paintCopy = TextPaint(paint).apply { textSize *= AMPLIFICATION_FACTOR }

    val capHeightBounds = Rect()
    paintCopy.getTextBounds(
        CAP_HEIGHT_MEASUREMENT_TEXT, 0, CAP_HEIGHT_MEASUREMENT_TEXT.length, capHeightBounds)
    val capHeight = capHeightBounds.height() / AMPLIFICATION_FACTOR / dm.density

    val xHeightBounds = Rect()
    paintCopy.getTextBounds(
        X_HEIGHT_MEASUREMENT_TEXT, 0, X_HEIGHT_MEASUREMENT_TEXT.length, xHeightBounds)
    val xHeight = xHeightBounds.height() / AMPLIFICATION_FACTOR / dm.density

    for (i in 0 until layout.lineCount) {
      val endsWithNewLine = text.isNotEmpty() && text[layout.getLineEnd(i) - 1] == '\n'
      val lineWidth = if (endsWithNewLine) layout.getLineMax(i) else layout.getLineWidth(i)
      val bounds = Rect()
      layout.getLineBounds(i, bounds)
      val line =
          Arguments.createMap().apply {
            putDouble("x", (layout.getLineLeft(i) / dm.density).toDouble())
            putDouble("y", (bounds.top / dm.density).toDouble())
            putDouble("width", (lineWidth / dm.density).toDouble())
            putDouble("height", (bounds.height() / dm.density).toDouble())
            putDouble("descender", (layout.getLineDescent(i) / dm.density).toDouble())
            putDouble("ascender", (-layout.getLineAscent(i) / dm.density).toDouble())
            putDouble("baseline", (layout.getLineBaseline(i) / dm.density).toDouble())
            putDouble("capHeight", capHeight.toDouble())
            putDouble("xHeight", xHeight.toDouble())
            putString(
                "text", text.subSequence(layout.getLineStart(i), layout.getLineEnd(i)).toString())
          }
      lines.pushMap(line)
    }
    return lines
  }
}
