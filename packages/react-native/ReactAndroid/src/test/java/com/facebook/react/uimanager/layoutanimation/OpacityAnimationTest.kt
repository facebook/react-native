/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import android.view.View
import android.view.animation.Transformation
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class OpacityAnimationTest {
  private lateinit var view: View
  private lateinit var animation: OpacityAnimation

  @Before
  fun setUp() {
    view = View(RuntimeEnvironment.getApplication())
  }

  @Test
  fun applyTransformation_updatesAlphaCorrectly() {
    val startOpacity = 0.5f
    val endOpacity = 1.0f
    animation = OpacityAnimation(view, startOpacity, endOpacity)

    val transformation = Transformation()
    animation.applyTransformation(0.0f, transformation)
    assertThat(view.alpha).isEqualTo(0.5f)

    animation.applyTransformation(0.5f, transformation)
    assertThat(view.alpha).isEqualTo(0.75f)

    animation.applyTransformation(1.0f, transformation)
    assertThat(view.alpha).isEqualTo(1.0f)
  }

  @Test
  fun willChangeBounds_returnsFalse() {
    animation = OpacityAnimation(view, 0.5f, 1.0f)
    assertThat(animation.willChangeBounds()).isFalse()
  }

  @Test
  fun onAnimationStart_setsLayerTypeHardwareIfOverlappingRendering() {
    val spyView: View = mock {
      on { hasOverlappingRendering() } doReturn true
      on { layerType } doReturn View.LAYER_TYPE_NONE
    }

    val listener = OpacityAnimation.OpacityAnimationListener(spyView)
    listener.onAnimationStart(mock())

    verify(spyView).setLayerType(View.LAYER_TYPE_HARDWARE, null)
  }

  @Test
  fun onAnimationStart_doesNotChangeLayerTypeIfAlreadySet() {
    val spyView: View = mock {
      on { hasOverlappingRendering() } doReturn true
      on { layerType } doReturn View.LAYER_TYPE_HARDWARE
    }

    val listener = OpacityAnimation.OpacityAnimationListener(spyView)
    listener.onAnimationStart(mock())

    verify(spyView, never()).setLayerType(View.LAYER_TYPE_HARDWARE, null)
  }

  @Test
  fun onAnimationEnd_resetsLayerTypeIfChanged() {
    val spyView: View = mock {
      on { hasOverlappingRendering() } doReturn true
      on { layerType } doReturn View.LAYER_TYPE_NONE
    }

    val listener = OpacityAnimation.OpacityAnimationListener(spyView)
    listener.onAnimationStart(mock())
    listener.onAnimationEnd(mock())

    verify(spyView).setLayerType(View.LAYER_TYPE_NONE, null)
  }

  @Test
  fun onAnimationRepeat_doesNothing() {
    val listener = OpacityAnimation.OpacityAnimationListener(mock())
    listener.onAnimationRepeat(mock())

    // No assertions needed, just verifying it runs without errors
  }
}
