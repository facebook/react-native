/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class OnLayoutEventTest {

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
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
    assertThat(event.x).isEqualTo(x)
    assertThat(event.y).isEqualTo(y)
    assertThat(event.width).isEqualTo(width)
    assertThat(event.height).isEqualTo(height)
  }

  @Test
  fun testGetEventName_shouldReturnCorrectEventName() {
    val event = OnLayoutEvent.obtain(1, 1, 10, 20, 100, 200)

    assertThat(event.getEventName()).isEqualTo("topLayout")
  }

  @Test
  fun testInit_shouldCorrectlyInitializeValues() {
    val event = OnLayoutEvent.obtain(1, 1, 10, 20, 100, 200)

    assertThat(event.surfaceId).isEqualTo(1)
    assertThat(event.viewTag).isEqualTo(1)
    assertThat(event.x).isEqualTo(10)
    assertThat(event.y).isEqualTo(20)
    assertThat(event.width).isEqualTo(100)
    assertThat(event.height).isEqualTo(200)
  }
}
