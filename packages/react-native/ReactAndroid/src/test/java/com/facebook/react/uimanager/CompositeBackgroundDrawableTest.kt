/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.annotation.TargetApi
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.LayerDrawable
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.drawable.BackgroundDrawable
import com.facebook.react.uimanager.drawable.BorderDrawable
import com.facebook.react.uimanager.drawable.CompositeBackgroundDrawable
import com.facebook.react.uimanager.drawable.InsetBoxShadowDrawable
import com.facebook.react.uimanager.drawable.OutlineDrawable
import com.facebook.react.uimanager.drawable.OutsetBoxShadowDrawable
import com.facebook.react.uimanager.style.OutlineStyle
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@TargetApi(29)
@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
class CompositeBackgroundDrawableTest {

  private val ctx: Context = RuntimeEnvironment.getApplication()
  private lateinit var rnFeatureFlags: MockedStatic<ReactNativeFeatureFlags>

  @Before
  fun setup() {
    rnFeatureFlags = mockStatic(ReactNativeFeatureFlags::class.java)
    rnFeatureFlags
        .`when`<Boolean> { ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables() }
        .thenReturn(true)
  }

  @Test
  fun testCompositeBackgroundDrawableLayerOrdering() {

    val background = BackgroundDrawable(ctx)
    val outerShadows =
        LayerDrawable(arrayOf(OutsetBoxShadowDrawable(ctx, Color.BLACK, 1f, 1f, 0f, 1f)))
    val innerShadows =
        LayerDrawable(arrayOf(InsetBoxShadowDrawable(ctx, Color.BLACK, 1f, 1f, 0f, 1f)))
    val border = BorderDrawable(ctx, null, null, null, null)
    val outline =
        OutlineDrawable(
            ctx,
            outlineColor = Color.BLACK,
            outlineOffset = 0f,
            outlineStyle = OutlineStyle.SOLID,
            outlineWidth = 1f)

    /** Create CompositeBackgroundDrawable with constructor */
    val control =
        CompositeBackgroundDrawable(
            context = ctx,
            outerShadows = outerShadows,
            background = background,
            border = border,
            innerShadows = innerShadows,
            outline = outline)

    /**
     * Create CompositeBackgroundDrawable with shuffled method functions (triggers layer ordering
     * logic)
     */
    val test = CompositeBackgroundDrawable(ctx)
    test.withNewInnerShadow(innerShadows)
    test.withNewOuterShadow(outerShadows)
    test.withNewBorder(border)
    test.withNewOutline(outline)
    test.withNewBackground(background)

    /** Verify that the two CompositeBackgroundDrawables are equivalent */
    assertThat(test.getDrawable(0)).isEqualTo(control.getDrawable(0))
    assertThat(test.getDrawable(1)).isEqualTo(control.getDrawable(1))
    assertThat(test.getDrawable(2)).isEqualTo(control.getDrawable(2))
    assertThat(test.getDrawable(3)).isEqualTo(control.getDrawable(3))
    assertThat(test.getDrawable(4)).isEqualTo(control.getDrawable(4))
  }
}
