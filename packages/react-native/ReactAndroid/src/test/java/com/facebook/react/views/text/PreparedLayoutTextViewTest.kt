/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import android.text.style.ClickableSpan
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.text.internal.span.StatefulSpan
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
@SuppressLint("NewApi")
class PreparedLayoutTextViewTest {

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @Test
  fun ellipsizedLayoutExposesFullSourceTextWithoutChangingDisplayText() {
    val preparedLayout = createPreparedLayout(SOURCE_TEXT, ellipsize = true)
    val displayText = preparedLayout.layout.text.toString()
    val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())

    view.preparedLayout = preparedLayout

    assertThat(displayText).contains(ELLIPSIS)
    assertThat(displayText).contains(ELLIPSIS_FILLER)
    assertThat(displayText).isNotEqualTo(SOURCE_TEXT)
    assertThat(displayText.length).isEqualTo(SOURCE_TEXT.length)
    assertThat(view.text.toString()).isEqualTo(SOURCE_TEXT)
    assertThat(view.preparedLayout?.layout?.text.toString()).isEqualTo(displayText)
  }

  @Test
  fun nonEllipsizedLayoutExposesFullSourceText() {
    val preparedLayout = createPreparedLayout(SOURCE_TEXT, ellipsize = false)
    val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())

    view.preparedLayout = preparedLayout

    assertThat(preparedLayout.layout.text.toString()).isEqualTo(SOURCE_TEXT)
    assertThat(view.text.toString()).isEqualTo(SOURCE_TEXT)
  }

  @Test
  fun ellipsizedSpannedTextRetainsFullClickableSourceText() {
    val clickableSpan =
        object : ClickableSpan() {
          override fun onClick(widget: View) = Unit
        }
    val sourceText = SpannableString(SOURCE_TEXT)
    sourceText.setSpan(
        clickableSpan,
        0,
        sourceText.length,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    val preparedLayout = createPreparedLayout(sourceText, ellipsize = true)
    val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())

    view.preparedLayout = preparedLayout

    val semanticText = view.text as Spanned
    assertThat(semanticText.toString()).isEqualTo(SOURCE_TEXT)
    assertThat(semanticText.getSpans(0, semanticText.length, ClickableSpan::class.java))
        .containsExactly(clickableSpan)
    assertThat(preparedLayout.layout.text.toString()).contains(ELLIPSIS)
  }

  @Test
  fun accessibilityDelegateExposesFullSourceText() {
    val preparedLayout = createPreparedLayout(SOURCE_TEXT, ellipsize = true)
    val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())
    view.preparedLayout = preparedLayout
    val delegate = ReactTextViewAccessibilityDelegate(view, false, view.importantForAccessibility)
    val nodeInfo = AccessibilityNodeInfoCompat.obtain()

    delegate.onInitializeAccessibilityNodeInfo(view, nodeInfo)

    assertThat(nodeInfo.text.toString()).isEqualTo(SOURCE_TEXT)
    assertThat(preparedLayout.layout.text.toString()).contains(ELLIPSIS)
  }

  @Test
  fun managerInstallsTextDelegateForPlainPreparedText() {
    val preparedLayout = createPreparedLayout(SOURCE_TEXT, ellipsize = true)
    val manager = PreparedLayoutTextViewManager()
    val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())
    manager.updateExtraData(view, preparedLayout)

    val delegate = ViewCompat.getAccessibilityDelegate(view)
    assertThat(delegate).isInstanceOf(ReactTextViewAccessibilityDelegate::class.java)
    val nodeInfo = AccessibilityNodeInfoCompat.obtain()
    checkNotNull(delegate).onInitializeAccessibilityNodeInfo(view, nodeInfo)
    assertThat(nodeInfo.text.toString()).isEqualTo(SOURCE_TEXT)
  }

  @Test
  fun legacyTextViewFallbackUsesFullSourceText() {
    val preparedLayout = createPreparedLayout(SOURCE_TEXT, ellipsize = true)
    val manager = ReactTextViewManager()
    val view = ReactTextView(RuntimeEnvironment.getApplication())

    val update = manager.getReactTextUpdateFromPreparedLayout(view, preparedLayout)

    assertThat(update.text.toString()).isEqualTo(SOURCE_TEXT)
    assertThat(update.text).isNotSameAs(preparedLayout.sourceText)
    assertThat(view.spanned).isSameAs(update.text)
    assertThat(view.preparedLayout).isSameAs(preparedLayout)
    assertThat(preparedLayout.layout.text.toString()).contains(ELLIPSIS)
  }

  @Test
  fun reactTagCopyRetainsFullSourceText() {
    val preparedLayout = createPreparedLayout(SOURCE_TEXT, ellipsize = true)
    val newReactTags = intArrayOf(10, 20)

    val copiedLayout = preparedLayout.copyWithReactTags(newReactTags)

    assertThat(copiedLayout.sourceText).isSameAs(preparedLayout.sourceText)
    assertThat(copiedLayout.layout).isSameAs(preparedLayout.layout)
    assertThat(copiedLayout.reactTags).containsExactly(10, 20)
    assertThat(copiedLayout.sourceText.toString()).isEqualTo(SOURCE_TEXT)
  }

  @Test
  fun statefulSpanProxyRetainsFullSourceTextAndSharesPerViewCloneWithDisplayText() {
    val originalSpan = TestStatefulSpan()
    val sourceText = SpannableString(SOURCE_TEXT)
    val spanStart = 5
    val spanEnd = sourceText.length - 5
    sourceText.setSpan(
        originalSpan,
        spanStart,
        spanEnd,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    val preparedLayout = createPreparedLayout(sourceText, ellipsize = true)
    val firstView = PreparedLayoutTextView(RuntimeEnvironment.getApplication())
    val secondView = PreparedLayoutTextView(RuntimeEnvironment.getApplication())

    firstView.preparedLayout = preparedLayout
    secondView.preparedLayout = preparedLayout

    val firstPreparedLayout = checkNotNull(firstView.preparedLayout)
    val secondPreparedLayout = checkNotNull(secondView.preparedLayout)
    val firstSourceText = firstPreparedLayout.sourceText
    val firstDisplayText = firstPreparedLayout.layout.text as Spanned
    val secondSourceText = secondPreparedLayout.sourceText
    val firstSourceSpan = firstSourceText.getStatefulSpan()
    val firstDisplaySpan = firstDisplayText.getStatefulSpan()
    val secondSourceSpan = secondSourceText.getStatefulSpan()

    assertThat(firstPreparedLayout.sourceText.toString()).isEqualTo(SOURCE_TEXT)
    assertThat(firstPreparedLayout.layout.text.toString()).contains(ELLIPSIS)
    assertThat(firstSourceSpan).isSameAs(firstDisplaySpan)
    assertThat(firstSourceSpan).isNotSameAs(originalSpan)
    assertThat(firstSourceSpan).isNotSameAs(secondSourceSpan)
    assertThat(firstSourceText.getSpanStart(firstSourceSpan)).isEqualTo(spanStart)
    assertThat(firstSourceText.getSpanEnd(firstSourceSpan)).isEqualTo(spanEnd)
    assertThat(firstDisplayText.getSpanStart(firstDisplaySpan)).isEqualTo(spanStart)
    assertThat(firstDisplayText.getSpanEnd(firstDisplaySpan)).isEqualTo(spanEnd)
    assertThat(secondSourceText.getSpanStart(secondSourceSpan)).isEqualTo(spanStart)
    assertThat(secondSourceText.getSpanEnd(secondSourceSpan)).isEqualTo(spanEnd)
  }

  private fun createPreparedLayout(text: CharSequence, ellipsize: Boolean): PreparedLayout {
    val sourceText = if (text is Spanned) text else SpannableString(text)
    val displayText = if (ellipsize) createEllipsizedDisplayText(sourceText) else sourceText
    val layout =
        StaticLayout.Builder.obtain(
                displayText,
                0,
                displayText.length,
                TextPaint().apply { textSize = 24f },
                1000,
            )
            .setIncludePad(false)
            .build()

    return PreparedLayout(
        layout,
        sourceText,
        if (ellipsize) 1 else -1,
        0f,
        intArrayOf(1),
        Layout.BREAK_STRATEGY_SIMPLE,
        0,
    )
  }

  private fun createEllipsizedDisplayText(sourceText: Spanned): Spanned {
    val ellipsisStart = sourceText.length / 2
    val displayText =
        SpannableString(
            buildString(sourceText.length) {
              append(sourceText, 0, ellipsisStart)
              append(ELLIPSIS)
              repeat(sourceText.length - ellipsisStart - 1) { append(ELLIPSIS_FILLER) }
            }
        )
    TextUtils.copySpansFrom(
        sourceText,
        0,
        sourceText.length,
        Any::class.java,
        displayText,
        0,
    )
    return displayText
  }

  private fun Spanned.getStatefulSpan(): TestStatefulSpan =
      getSpans(0, length, TestStatefulSpan::class.java).single()

  private class TestStatefulSpan : StatefulSpan {
    override fun clone(): StatefulSpan = TestStatefulSpan()
  }

  private companion object {
    const val SOURCE_TEXT = "This is an order created from the data builder"
    const val ELLIPSIS = "\u2026"
    const val ELLIPSIS_FILLER = "\uFEFF"
  }
}
