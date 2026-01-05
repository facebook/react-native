/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.Spanned
import android.text.TextPaint
import android.text.style.CharacterStyle
import kotlin.math.max

internal class ShadowStyleSpan(
    private val dx: Float,
    private val dy: Float,
    private val radius: Float,
    val color: Int
) : CharacterStyle(), ReactSpan {
  override fun updateDrawState(textPaint: TextPaint) {
    textPaint.setShadowLayer(radius, dx, dy, color)
  }

  public fun getLeftOffset(): Float = max(0f, radius - dx)

  public companion object {
    @JvmStatic
    public fun getShadowSpan(spanned: Spanned?): ShadowStyleSpan? {
      if (spanned == null) return null
      val spans = spanned.getSpans(0, spanned.length, ShadowStyleSpan::class.java)
      return spans.firstOrNull()
    }
  }
}
