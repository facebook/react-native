/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Canvas
import android.text.Layout
import android.text.style.UpdateAppearance

/**
 * May be overriden to implement charater styles which are applied by [PreparedLayoutTextView]
 * during the drawing of text, against the underlying Android canvas
 */
public abstract class DrawCommandSpan : UpdateAppearance, ReactSpan {
  /**
   * Called before the text is drawn. This happens after the Paragraph component has drawn its
   * background, but may be called before text spans with their own background color are drawn.
   */
  public open fun onPreDraw(start: Int, end: Int, canvas: Canvas, layout: Layout): Unit = Unit

  /** Called after the text is drawn, including some effects like text shadows */
  public open fun onDraw(start: Int, end: Int, canvas: Canvas, layout: Layout): Unit = Unit
}
