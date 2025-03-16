/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.After
import org.mockito.kotlin.mock
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import com.facebook.react.common.SystemClock
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith

@RunWith(RobolectricTestRunner::class)
class OnLayoutEventTest {
  private lateinit var onLayoutEvent: OnLayoutEvent
  private lateinit var systemClock: MockedStatic<SystemClock>

  @Before
  fun setup() {
    onLayoutEvent = mock<OnLayoutEvent>()

    val ts = SystemClock.uptimeMillis()
    systemClock = mockStatic(SystemClock::class.java)
    systemClock.`when`<Long> { SystemClock.uptimeMillis() }.thenReturn(ts)
  }

  @After
  fun tearDown() {
    systemClock.close()
  }

  @Test
  fun testObtain_shouldReturnEventWithCorrectValues() {
    val surfaceId = 1
    val viewTag = 2
    val x = 10
    val y = 20
    val width = 100
    val height = 200

    val event = OnLayoutEvent.obtain(surfaceId, viewTag, x, y, width, height)

    assertThat(event).isNotNull
    assertThat(event.viewTag).isEqualTo(viewTag)
    assertThat(event.mX).isEqualTo(x)
    assertThat(event.mY).isEqualTo(y)
    assertThat(event.mWidth).isEqualTo(width)
    assertThat(event.mHeight).isEqualTo(height)
  }

  @Test
  fun testGetEventName_shouldReturnCorrectEventName() {
    val event = OnLayoutEvent.obtain(1, 1, 10, 20, 100, 200)

    assertThat(event.eventName).isEqualTo("topLayout")
  }

  @Test
  fun testInit_shouldCorrectlyInitializeValues() {
    val event = OnLayoutEvent.obtain(1, 1, 10, 20, 100, 200)

    assertThat(event.surfaceId).isEqualTo(1)
    assertThat(event.viewTag).isEqualTo(1)
    assertThat(event.mX).isEqualTo(10)
    assertThat(event.mY).isEqualTo(20)
    assertThat(event.mWidth).isEqualTo(100)
    assertThat(event.mHeight).isEqualTo(200)
  }
}
