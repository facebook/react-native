/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.interop

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class InteropEventEmitterTest {
  lateinit var mReactContext: ReactContext
  lateinit var mEventDispatcher: FakeEventDispatcher

  @Before
  fun setup() {
    mReactContext = ReactApplicationContext(RuntimeEnvironment.application)
    mEventDispatcher = FakeEventDispatcher()
  }

  @Test
  fun receiveEvent_dispatchesCorrectly() {
    val eventEmitter = InteropEventEmitter(mReactContext)
    eventEmitter.overrideEventDispatcher(mEventDispatcher)

    eventEmitter.receiveEvent(42, "onTest", null)

    assertEquals(1, mEventDispatcher.getRecordedDispatchedEvents().size)
    assertEquals("onTest", mEventDispatcher.getRecordedDispatchedEvents().get(0).getEventName())
    assertEquals(
      InteropEvent::class,
      mEventDispatcher.getRecordedDispatchedEvents().get(0)::class
    )
  }

  @Test
  fun receiveEvent_dataIsPreserved() {
    val eventEmitter = InteropEventEmitter(mReactContext)
    eventEmitter.overrideEventDispatcher(mEventDispatcher)
    val eventData = JavaOnlyMap.of("color", "indigo")

    eventEmitter.receiveEvent(42, "onTest", eventData)

    val event = mEventDispatcher.getRecordedDispatchedEvents().get(0) as InteropEvent
    val dispatchedEventData = event.getEventData()
    assertNotNull(dispatchedEventData)
    assertEquals("indigo", dispatchedEventData!!.getString("color"))
  }

  @Test(expected = java.lang.UnsupportedOperationException::class)
  fun receiveTouches_isNotSupported() {
    val eventEmitter = InteropEventEmitter(mReactContext)
    eventEmitter.receiveTouches("a touch", null, null)
  }
}
