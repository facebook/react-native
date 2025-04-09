/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.drawable.Drawable
import android.text.Spannable
import android.text.style.ReplacementSpan
import android.view.View
import android.widget.TextView

/** Base class for inline image spans. */
internal abstract class TextInlineImageSpan : ReplacementSpan(), ReactSpan {
  /** Get the drawable that is span represents. */
  abstract val drawable: Drawable?

  /** Called by the text view from [View.onDetachedFromWindow], */
  abstract fun onDetachedFromWindow()

  /** Called by the text view from [View.onStartTemporaryDetach]. */
  abstract fun onStartTemporaryDetach()

  /** Called by the text view from [View.onAttachedToWindow]. */
  abstract fun onAttachedToWindow()

  /** Called by the text view from [View.onFinishTemporaryDetach]. */
  abstract fun onFinishTemporaryDetach()

  /** Set the textview that will contain this span. */
  abstract fun setTextView(textView: TextView?)

  /** Get the width of the span. */
  abstract val width: Int

  /** Get the height of the span. */
  abstract val height: Int

  companion object {
    /**
     * For TextInlineImageSpan we need to update the Span to know that the window is attached and
     * the TextView that we will set as the callback on the Drawable.
     *
     * @param spannable The spannable that may contain TextInlineImageSpans
     * @param view The view which will be set as the callback for the Drawable
     */
    @JvmStatic
    fun possiblyUpdateInlineImageSpans(spannable: Spannable, view: TextView?) {
      spannable.getSpans(0, spannable.length, TextInlineImageSpan::class.java).forEach { s ->
        s.onAttachedToWindow()
        s.setTextView(view)
      }
    }
  }
}
