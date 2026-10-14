/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.views.text.internal.span.StatefulSpan
import java.util.IdentityHashMap

/**
 * A delegating [Layout] subclass that clones both the display-shaped text from [delegate] and its
 * full source text. Corresponding [StatefulSpan] instances in both copies are replaced with the
 * same fresh clone, while spans present in only one copy are cloned on demand. This gives each
 * [PreparedLayoutTextView] independent mutable span state (e.g. particle animation, dismiss state)
 * even when the underlying [Layout] is shared from a cache.
 *
 * The mutable display text can be useful for spans which affect display, but do not alter existing
 * layout calculations.
 *
 * Line metrics are delegated to [delegate] so no expensive [StaticLayout] rebuild is needed.
 * [Layout.getText] is final and returns `mText` set by the protected constructor, so the cloned
 * [SpannableString] is passed there directly.
 */
internal class MutableSpannableLayout
private constructor(
    private val delegate: Layout,
    clonedText: SpannableString,
    val sourceText: Spanned,
) :
    Layout(
        clonedText,
        delegate.paint,
        delegate.width,
        delegate.alignment,
        delegate.spacingMultiplier,
        delegate.spacingAdd,
    ) {

  companion object {
    /** Returns a [MutableSpannableLayout] if [layout] contains stateful spans, else null. */
    @OptIn(UnstableReactNativeAPI::class)
    fun createIfNeeded(layout: Layout, sourceText: Spanned): MutableSpannableLayout? {
      val layoutText = layout.text as? Spanned ?: return null
      val statefulSpans = layoutText.getSpans(0, layoutText.length, StatefulSpan::class.java)
      if (statefulSpans.isEmpty()) {
        return null
      }

      val spanClones = IdentityHashMap<StatefulSpan, StatefulSpan>()
      val clonedSourceText = SpannableString(sourceText)
      for (oldSpan in sourceText.getSpans(0, sourceText.length, StatefulSpan::class.java)) {
        val newSpan = spanClones.getOrPut(oldSpan) { oldSpan.clone() }
        replaceSpan(clonedSourceText, oldSpan, newSpan)
      }

      val clonedLayoutText = SpannableString(layoutText)
      for (oldSpan in statefulSpans) {
        val newSpan = spanClones.getOrPut(oldSpan) { oldSpan.clone() }
        replaceSpan(clonedLayoutText, oldSpan, newSpan)
      }
      return MutableSpannableLayout(layout, clonedLayoutText, clonedSourceText)
    }

    @OptIn(UnstableReactNativeAPI::class)
    private fun replaceSpan(
        text: SpannableString,
        oldSpan: StatefulSpan,
        newSpan: StatefulSpan,
    ) {
      val start = text.getSpanStart(oldSpan)
      val end = text.getSpanEnd(oldSpan)
      val flags = text.getSpanFlags(oldSpan)
      text.removeSpan(oldSpan)
      text.setSpan(newSpan, start, end, flags)
    }
  }

  // --- 10 abstract methods — delegate to original ---

  override fun getLineCount(): Int = delegate.lineCount

  override fun getLineTop(line: Int): Int = delegate.getLineTop(line)

  override fun getLineDescent(line: Int): Int = delegate.getLineDescent(line)

  override fun getLineStart(line: Int): Int = delegate.getLineStart(line)

  override fun getLineContainsTab(line: Int): Boolean = delegate.getLineContainsTab(line)

  override fun getLineDirections(line: Int): Directions = delegate.getLineDirections(line)

  override fun getTopPadding(): Int = delegate.topPadding

  override fun getBottomPadding(): Int = delegate.bottomPadding

  override fun getEllipsisStart(line: Int): Int = delegate.getEllipsisStart(line)

  override fun getEllipsisCount(line: Int): Int = delegate.getEllipsisCount(line)

  override fun getParagraphDirection(line: Int): Int = delegate.getParagraphDirection(line)

  // --- Non-abstract overrides for performance/correctness ---
  // StaticLayout overrides these with optimized implementations. Delegating
  // ensures we get the original's fast paths rather than Layout's base
  // implementations that recompute from scratch.

  override fun getEllipsizedWidth(): Int = delegate.ellipsizedWidth

  override fun getLineMax(line: Int): Float = delegate.getLineMax(line)

  override fun getLineWidth(line: Int): Float = delegate.getLineWidth(line)

  override fun getLineLeft(line: Int): Float = delegate.getLineLeft(line)

  override fun getLineRight(line: Int): Float = delegate.getLineRight(line)

  // Only called by the framework on API 33+
  @android.annotation.SuppressLint("NewApi")
  override fun isFallbackLineSpacingEnabled(): Boolean = delegate.isFallbackLineSpacingEnabled
}
