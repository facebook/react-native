/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtual.view

import android.app.Activity
import android.content.Context
import android.graphics.Rect
import android.util.DisplayMetrics
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.scroll.ReactScrollView
import com.facebook.react.views.virtual.VirtualViewMode
import com.facebook.react.views.virtual.VirtualViewModeChangeEvent
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Tests [ReactVirtualView] */
@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class ReactVirtualViewTest {

  private lateinit var context: Context

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()

    context = Robolectric.buildActivity(Activity::class.java).create().get()

    val displayMetricsHolder = mockStatic(DisplayMetricsHolder::class.java)
    displayMetricsHolder
        .`when`<DisplayMetrics> { DisplayMetricsHolder.getWindowDisplayMetrics() }
        .thenAnswer { DisplayMetrics().apply { density = 1f } }
  }

  @Test
  fun `ensure mode change from visible to hidden`() {
    val dispatcher = mock<EventDispatcher>()
    val view = ReactVirtualView(context)
    view.layout(0, 0, 100, 50)
    view.modeChangeEmitter = VirtualViewEventEmitter(1, 1, dispatcher)
    val newScrollView = TestScrollView(context)
    newScrollView.addView(view)

    // initial layout with visible view
    newScrollView.drawingRect.set(0, 0, 100, 200)
    // trigger first event
    view.doAttachedToWindow()

    // "scroll" to make view "hidden"
    // Set offset >= prerenderRatio (default 5) * newScrollView.height + height of view
    // Note: boundaries are not considered in overlapping
    newScrollView.drawingRect.offsetTo(0, 1050)
    // trigger second event
    view.onScroll(newScrollView, null, 0f, 0f)

    // change view rect to verify this does not affect previous events
    view.layout(0, 20, 100, 40)

    argumentCaptor<Event<*>>().apply {
      verify(dispatcher, times(2)).dispatchEvent(capture())
      verifyEvent(
          allValues[0],
          expectedMode = VirtualViewMode.Visible,
          expectedTargetY = 0,
          expectedTargetHeight = 50,
          expectedThresholdY = 0,
          expectedThresholdHeight = 200)
      verifyEvent(
          allValues[1],
          expectedMode = VirtualViewMode.Hidden,
          expectedTargetY = 0,
          expectedTargetHeight = 50,
          expectedThresholdY = 0,
          expectedThresholdHeight = 0)
    }
  }

  private fun verifyEvent(
      event: Event<*>,
      expectedMode: VirtualViewMode,
      expectedTargetY: Int,
      expectedTargetHeight: Int,
      expectedThresholdY: Int,
      expectedThresholdHeight: Int,
  ) {
    val modeChangeEvent = event as VirtualViewModeChangeEvent
    val mode = checkNotNull(modeChangeEvent.getEventData().getInt("mode"))
    assertThat(mode).isEqualTo(expectedMode.value)
    val targetRect = checkNotNull(modeChangeEvent.getEventData().getMap("targetRect"))
    assertThat(targetRect.getDouble("y").toInt()).isEqualTo(expectedTargetY)
    assertThat(targetRect.getDouble("height").toInt()).isEqualTo(expectedTargetHeight)
    val thresholdRect = checkNotNull(modeChangeEvent.getEventData().getMap("thresholdRect"))
    assertThat(thresholdRect.getDouble("y").toInt()).isEqualTo(expectedThresholdY)
    assertThat(thresholdRect.getDouble("height").toInt()).isEqualTo(expectedThresholdHeight)
  }
}

private class TestScrollView(context: Context) : ReactScrollView(context) {
  val drawingRect: Rect = Rect()

  /** Used by [ReactVirtualView.updateRects] to determine the parent rect. */
  override fun getDrawingRect(outRect: Rect?) {
    outRect?.set(drawingRect)
  }
}
