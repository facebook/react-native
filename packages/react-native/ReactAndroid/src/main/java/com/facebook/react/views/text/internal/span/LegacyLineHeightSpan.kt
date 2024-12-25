/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Paint.FontMetricsInt
import android.text.style.LineHeightSpan
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.min

/**
 * We use a custom [LineHeightSpan], because `lineSpacingExtra` is broken. Details here:
 * https://github.com/facebook/react-native/issues/7546
 */
public class LegacyLineHeightSpan(height: Float) : LineHeightSpan, ReactSpan {
  public val lineHeight: Int = ceil(height.toDouble()).toInt()

  public override fun chooseHeight(
      text: CharSequence?,
      start: Int,
      end: Int,
      spanstartv: Int,
      v: Int,
      fm: FontMetricsInt,
  ) {
    // This is more complicated that I wanted it to be. You can find a good explanation of what the
    // FontMetrics mean here: http://stackoverflow.com/questions/27631736.
    // The general solution is that if there's not enough height to show the full line height, we
    // will prioritize in this order: descent, ascent, bottom, top

    if (fm.descent > lineHeight) {
      // Show as much descent as possible
      fm.descent = min(lineHeight.toDouble(), fm.descent.toDouble()).toInt()
      fm.bottom = fm.descent
      fm.ascent = 0
      fm.top = fm.ascent
    } else if (-fm.ascent + fm.descent > lineHeight) {
      // Show all descent, and as much ascent as possible
      fm.bottom = fm.descent
      fm.ascent = -lineHeight + fm.descent
      fm.top = fm.ascent
    } else if (-fm.ascent + fm.bottom > lineHeight) {
      // Show all ascent, descent, as much bottom as possible
      fm.top = fm.ascent
      fm.bottom = fm.ascent + lineHeight
    } else if (-fm.top + fm.bottom > lineHeight) {
      // Show all ascent, descent, bottom, as much top as possible
      fm.top = fm.bottom - lineHeight
    } else {
      // Show proportionally additional ascent / top & descent / bottom
      val additional = lineHeight - (-fm.top + fm.bottom)

      // Round up for the negative values and down for the positive values  (arbitrary choice)
      // So that bottom - top equals additional even if it's an odd number.
      val top = (fm.top - ceil(additional / 2.0f)).toInt()
      val bottom = (fm.bottom + floor(additional / 2.0f)).toInt()

      fm.top = top
      fm.ascent = top
      fm.descent = bottom
      fm.bottom = bottom
    }
  }
}
