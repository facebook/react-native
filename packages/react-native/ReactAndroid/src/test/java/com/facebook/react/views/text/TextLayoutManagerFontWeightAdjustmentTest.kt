/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.res.AssetManager
import android.graphics.Typeface
import android.text.SpannableString
import android.text.TextPaint
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.views.text.internal.span.CustomStyleSpan
import com.facebook.react.views.text.internal.span.ReactTextPaintHolderSpan
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RuntimeEnvironment
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class TextLayoutManagerFontWeightAdjustmentTest {

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun `plain text paint applies Android font weight adjustment`() {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
    val textAttributes = TextAttributeProps.fromReadableMap(ReactStylesDiffMap(JavaOnlyMap()))

    invokeUpdateTextPaint(
        paint,
        textAttributes,
        RuntimeEnvironment.getApplication().assets,
        FONT_WEIGHT_ADJUSTMENT_BOLD_TEXT,
    )

    assertThat(paint.typeface).isNotNull
    assertThat(paint.typeface).isNotSameAs(Typeface.DEFAULT)
  }

  @Test
  fun `plain text paint keeps default typeface unset without font weight adjustment`() {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
    val textAttributes = TextAttributeProps.fromReadableMap(ReactStylesDiffMap(JavaOnlyMap()))

    invokeUpdateTextPaint(
        paint,
        textAttributes,
        RuntimeEnvironment.getApplication().assets,
        0,
    )

    assertThat(paint.typeface).isNull()
  }

  @Test
  fun `cached spannable is recreated when Android font weight adjustment changes`() {
    val cachedSpannable = SpannableString("A")
    cachedSpannable.setSpan(
        ReactTextPaintHolderSpan(TextPaint(TextPaint.ANTI_ALIAS_FLAG)),
        0,
        cachedSpannable.length,
        0,
    )
    TextLayoutManager.setCachedSpannableForTag(CACHE_ID, 0, cachedSpannable)

    val adjustedSpannable =
        TextLayoutManager.getOrCreateSpannableForText(
            RuntimeEnvironment.getApplication().assets,
            FONT_WEIGHT_ADJUSTMENT_BOLD_TEXT,
            cachedAttributedString(),
            null,
        )

    assertThat(adjustedSpannable).isNotSameAs(cachedSpannable)
    val customStyleSpan =
        adjustedSpannable.getSpans(0, adjustedSpannable.length, CustomStyleSpan::class.java)[0]
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)

    customStyleSpan.updateDrawState(paint)

    assertThat(paint.typeface).isNotSameAs(Typeface.DEFAULT)
  }

  private fun invokeUpdateTextPaint(
      paint: TextPaint,
      textAttributes: TextAttributeProps,
      assets: AssetManager,
      fontWeightAdjustment: Int,
  ) {
    val method =
        TextLayoutManager::class
            .java
            .getDeclaredMethod(
                "updateTextPaint",
                TextPaint::class.java,
                TextAttributeProps::class.java,
                AssetManager::class.java,
                java.lang.Integer.TYPE,
            )
            .apply { isAccessible = true }

    method.invoke(TextLayoutManager, paint, textAttributes, assets, fontWeightAdjustment)
  }

  private companion object {
    const val CACHE_ID = 1001
    const val FONT_WEIGHT_ADJUSTMENT_BOLD_TEXT = 300

    fun cachedAttributedString(): WritableMapBuffer {
      val textAttributes =
          WritableMapBuffer().put(TextAttributeProps.TA_KEY_FONT_WEIGHT, "normal").put(
              TextAttributeProps.TA_KEY_FONT_SIZE,
              14.0,
          )
      val fragment =
          WritableMapBuffer()
              .put(TextLayoutManager.FR_KEY_STRING, "A")
              .put(TextLayoutManager.FR_KEY_REACT_TAG, 1)
              .put(TextLayoutManager.FR_KEY_TEXT_ATTRIBUTES, textAttributes)
      val fragments = WritableMapBuffer().put(0, fragment)
      return WritableMapBuffer()
          .put(TextLayoutManager.AS_KEY_CACHE_ID, CACHE_ID)
          .put(TextLayoutManager.AS_KEY_FRAGMENTS, fragments)
          .put(TextLayoutManager.AS_KEY_BASE_ATTRIBUTES, WritableMapBuffer())
    }
  }
}
