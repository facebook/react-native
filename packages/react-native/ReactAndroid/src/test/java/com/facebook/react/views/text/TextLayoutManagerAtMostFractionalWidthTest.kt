/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.text.BoringLayout
import android.text.Layout
import android.text.SpannableString
import android.text.TextPaint
import com.facebook.yoga.YogaMeasureMode
import kotlin.math.floor
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class TextLayoutManagerAtMostFractionalWidthTest {

  @Test
  fun `AT_MOST measure and EXACTLY draw at the same fractional width have the same line count`() {
    val text = SpannableString("Keep watching this text")
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 16f }
    val desiredWidth = Layout.getDesiredWidth(text, paint)
    // A width the text fits in, but whose floor is smaller than the text.
    val width = floor(desiredWidth) + (desiredWidth - floor(desiredWidth) + 1f) / 2f
    assertThat(floor(width)).isLessThan(desiredWidth)
    assertThat(width).isGreaterThanOrEqualTo(desiredWidth)

    val measured = invokeCreateLayout(text, width, YogaMeasureMode.AT_MOST, paint)
    val drawn = invokeCreateLayout(text, width, YogaMeasureMode.EXACTLY, paint)

    assertThat(measured.lineCount).isEqualTo(drawn.lineCount)
  }

  @SuppressLint("InlinedApi")
  private fun invokeCreateLayout(
      text: SpannableString,
      width: Float,
      mode: YogaMeasureMode,
      paint: TextPaint,
  ): Layout =
      TextLayoutManager.createLayout(
          text,
          BoringLayout.isBoring(text, paint),
          width,
          mode,
          /* includeFontPadding = */ false,
          /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
          /* hyphenationFrequency = */ Layout.HYPHENATION_FREQUENCY_NONE,
          Layout.Alignment.ALIGN_NORMAL,
          /* justificationMode = */ 0,
          /* ellipsizeMode = */ null,
          /* maxNumberOfLines = */ 2,
          paint,
      )
}
