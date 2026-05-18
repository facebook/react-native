/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text

import android.graphics.Color
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.AbsoluteSizeSpan
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactTextViewAccessibilityDelegateTest {
  @Test
  fun reactTextViewAccessibilityNodeText_stripsStyleSpans() {
    val textView = createReactTextViewWithStyledText("Start")

    val nodeInfo = createNodeInfo(textView)

    assertSourceTextKeepsStyleSpans(textView.text)
    assertThat(nodeInfo.text.toString()).isEqualTo("Start")
    assertThat(nodeInfo.text).isNotInstanceOf(Spanned::class.java)
  }

  @Test
  fun reactTextViewAccessibilityNodeText_preservesExplicitContentDescription() {
    val textView = createReactTextViewWithStyledText("Visible text")
    textView.contentDescription = "Custom label"

    val nodeInfo = createNodeInfo(textView)

    assertThat(textView.contentDescription.toString()).isEqualTo("Custom label")
    assertThat(nodeInfo.text.toString()).isEqualTo("Visible text")
    assertThat(nodeInfo.text).isNotInstanceOf(Spanned::class.java)
  }

  @Test
  fun reactTextViewAccessibilityNodeText_doesNotStripSourceClickableSpans() {
    val clickableSpan =
        object : ClickableSpan() {
          override fun onClick(widget: View) = Unit
        }
    val text = createStyledText("Read docs")
    text.setSpan(clickableSpan, 5, 9, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    val textView = createReactTextView(text)

    val nodeInfo = createNodeInfo(textView)
    val sourceText = textView.text as Spanned

    assertThat(sourceText.getSpans(0, sourceText.length, ClickableSpan::class.java)).isNotEmpty()
    assertSourceTextKeepsStyleSpans(sourceText)
    assertThat(nodeInfo.text.toString()).isEqualTo("Read docs")
    assertThat(nodeInfo.text).isNotInstanceOf(Spanned::class.java)
  }

  @Test
  fun preparedLayoutTextViewAccessibilityNodeText_stripsStyleSpans() {
    val text = createStyledText("Prepared text")
    val layout =
        StaticLayout.Builder.obtain(text, 0, text.length, TextPaint(), 300).build()
    val textView = PreparedLayoutTextView(RuntimeEnvironment.getApplication())
    textView.preparedLayout =
        PreparedLayout(
            layout,
            Int.MAX_VALUE,
            0f,
            intArrayOf(1),
            Layout.BREAK_STRATEGY_SIMPLE,
            0,
        )
    ReactTextViewAccessibilityDelegate.resetDelegate(
        textView,
        textView.isFocusable,
        textView.importantForAccessibility,
    )

    val nodeInfo = createNodeInfo(textView)

    assertSourceTextKeepsStyleSpans(textView.text)
    assertThat(nodeInfo.text.toString()).isEqualTo("Prepared text")
    assertThat(nodeInfo.text).isNotInstanceOf(Spanned::class.java)
  }

  private fun createReactTextViewWithStyledText(text: String): ReactTextView {
    return createReactTextView(createStyledText(text))
  }

  private fun createReactTextView(text: Spanned): ReactTextView {
    val textView = ReactTextView(RuntimeEnvironment.getApplication())
    textView.setText(
        ReactTextUpdate(
            text,
            -1,
            0,
            Layout.BREAK_STRATEGY_SIMPLE,
            0,
        )
    )
    ReactTextViewAccessibilityDelegate.resetDelegate(
        textView,
        textView.isFocusable,
        textView.importantForAccessibility,
    )
    return textView
  }

  private fun createStyledText(text: String): SpannableString =
      SpannableString(text).apply {
        setSpan(AbsoluteSizeSpan(48), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        setSpan(ForegroundColorSpan(Color.BLACK), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      }

  private fun createNodeInfo(view: View): AccessibilityNodeInfoCompat =
      AccessibilityNodeInfoCompat.obtain().also {
        ViewCompat.onInitializeAccessibilityNodeInfo(view, it)
      }

  private fun assertSourceTextKeepsStyleSpans(text: CharSequence?) {
    assertThat(text).isInstanceOf(Spanned::class.java)
    val spanned = text as Spanned
    assertThat(spanned.getSpans(0, spanned.length, AbsoluteSizeSpan::class.java)).isNotEmpty()
    assertThat(spanned.getSpans(0, spanned.length, ForegroundColorSpan::class.java)).isNotEmpty()
  }
}
