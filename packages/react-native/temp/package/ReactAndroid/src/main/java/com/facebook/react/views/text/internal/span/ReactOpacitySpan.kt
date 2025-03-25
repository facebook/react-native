/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Color
import android.text.TextPaint
import android.text.style.CharacterStyle
import android.text.style.UpdateAppearance
import kotlin.math.roundToInt

/** Multiplies foreground and background alpha channels by given opacity */
public class ReactOpacitySpan(public val opacity: Float) :
    CharacterStyle(), UpdateAppearance, ReactSpan {

  override fun updateDrawState(paint: TextPaint) {
    paint.alpha = (Color.alpha(paint.color) * opacity).roundToInt()

    if (paint.bgColor != 0) {
      paint.bgColor =
          Color.argb(
              (Color.alpha(paint.bgColor) * opacity).roundToInt(),
              Color.red(paint.bgColor),
              Color.green(paint.bgColor),
              Color.blue(paint.bgColor),
          )
    }
  }
}
