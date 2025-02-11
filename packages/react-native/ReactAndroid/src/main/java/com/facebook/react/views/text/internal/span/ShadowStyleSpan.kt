/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.TextPaint
import android.text.style.CharacterStyle

public class ShadowStyleSpan(
    private val dx: Float,
    private val dy: Float,
    private val radius: Float,
    public val color: Int
) : CharacterStyle(), ReactSpan {
  public override fun updateDrawState(textPaint: TextPaint) {
    textPaint.setShadowLayer(radius, dx, dy, color)
  }
}
