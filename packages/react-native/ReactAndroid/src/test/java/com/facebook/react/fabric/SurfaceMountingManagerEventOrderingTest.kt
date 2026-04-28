/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.fabric

import android.os.Looper
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.fabric.events.EventEmitterWrapper
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.events.EventCategoryDef
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.inOrder
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

/**
 * Regression tests for issue #54636: events emitted before [SurfaceMountingManager.updateEventEmitter]
 * has run must reach JS in receive order, even if a later event happens to find the emitter ready.
 *
 * The fix relies on [SurfaceMountingManager.hasPendingEvents] reflecting that an enqueue lambda
 * has been posted to the UI thread but not yet executed, so callers can route subsequent events
 * through the same queue path instead of dispatching them directly.
 */
@RunWith(RobolectricTestRunner::class)
@LooperMode(LooperMode.Mode.PAUSED)
@Config(shadows = [ShadowSoLoader::class])
class SurfaceMountingManagerEventOrderingTest {
  private lateinit var mountingManager: MountingManager
  private lateinit var themedReactContext: ThemedReactContext
  private val surfaceId = 1
  private val reactTag = 42

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val reactContext = ReactTestHelper.createCatalystContextForTest()
    themedReactContext = ThemedReactContext(reactContext, reactContext, null, -1)
    mountingManager =
        MountingManager(
            ViewManagerRegistry(listOf<ViewManager<*, *>>(ReactViewManager())),
            MountItemExecutor {},
        )
  }

  private fun startSurfaceWithView(): SurfaceMountingManager {
    val rootView = ReactRootView(themedReactContext)
    mountingManager.startSurface(surfaceId, themedReactContext, rootView)
    val smm = mountingManager.getSurfaceManagerEnforced(surfaceId, "test")
    smm.preallocateView("RCTView", reactTag, JavaOnlyMap.of(), null, true)
    return smm
  }

  /**
   * After enqueuePendingEvent posts its UI-thread lambda, hasPendingEvents must return true so
   * that any concurrent direct-dispatch path knows to also queue rather than overtake.
   */
  @Test
  fun hasPendingEvents_isTrue_whileEnqueueLambdaIsInFlight() {
    val smm = startSurfaceWithView()

    assertThat(smm.hasPendingEvents(reactTag)).isFalse()

    smm.enqueuePendingEvent(
        reactTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 0L)

    assertThat(smm.hasPendingEvents(reactTag)).isTrue()

    shadowOf(Looper.getMainLooper()).idle()

    assertThat(smm.hasPendingEvents(reactTag)).isFalse()
  }

  /**
   * MountingManager.hasPendingEvents must mirror the SurfaceMountingManager state so callers above
   * the surface layer (e.g. FabricUIManager.receiveEvent) can consult it.
   */
  @Test
  fun mountingManager_hasPendingEvents_mirrorsSurfaceMountingManager() {
    startSurfaceWithView()

    assertThat(mountingManager.hasPendingEvents(surfaceId, reactTag)).isFalse()

    mountingManager.enqueuePendingEvent(
        surfaceId, reactTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 0L)

    assertThat(mountingManager.hasPendingEvents(surfaceId, reactTag)).isTrue()

    shadowOf(Looper.getMainLooper()).idle()

    assertThat(mountingManager.hasPendingEvents(surfaceId, reactTag)).isFalse()
  }

  /**
   * The counter must match the number of in-flight enqueue lambdas, so that interleaved enqueue
   * + direct-route-to-enqueue calls are all accounted for and only fall back to false once the UI
   * thread has fully drained them.
   */
  @Test
  fun hasPendingEvents_remainsTrue_acrossMultipleEnqueues() {
    val smm = startSurfaceWithView()

    smm.enqueuePendingEvent(
        reactTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 0L)
    smm.enqueuePendingEvent(
        reactTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 1L)
    smm.enqueuePendingEvent(
        reactTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 2L)

    assertThat(smm.hasPendingEvents(reactTag)).isTrue()

    shadowOf(Looper.getMainLooper()).idle()

    assertThat(smm.hasPendingEvents(reactTag)).isFalse()
  }

  /** Tags with no enqueue activity must not report pending events. */
  @Test
  fun hasPendingEvents_isFalse_forUnrelatedTag() {
    val smm = startSurfaceWithView()
    val otherTag = reactTag + 1
    smm.preallocateView("RCTView", otherTag, JavaOnlyMap.of(), null, true)

    smm.enqueuePendingEvent(
        reactTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 0L)

    assertThat(smm.hasPendingEvents(reactTag)).isTrue()
    assertThat(smm.hasPendingEvents(otherTag)).isFalse()

    shadowOf(Looper.getMainLooper()).idle()
  }

  /** Calling enqueuePendingEvent for a tag without view state must not falsely flag it. */
  @Test
  fun hasPendingEvents_isFalse_forUnknownTag() {
    startSurfaceWithView()
    val unknownTag = reactTag + 99

    mountingManager.enqueuePendingEvent(
        surfaceId, unknownTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 0L)

    assertThat(mountingManager.hasPendingEvents(surfaceId, unknownTag)).isFalse()
  }

  /**
   * End-to-end ordering invariant: when a caller observes [hasPendingEvents] is true and routes a
   * subsequent event through [enqueuePendingEvent] (instead of dispatching directly), the emitter
   * must observe the events in receive order. This is the contract the [FabricUIManager.receiveEvent]
   * fix relies on to prevent #54636.
   */
  @Test
  fun enqueuePendingEvent_dispatchesInFifoOrder_whenLambdaIsInFlight() {
    val smm = startSurfaceWithView()
    val emitter: EventEmitterWrapper = mock()

    smm.updateEventEmitter(reactTag, emitter)

    shadowOf(Looper.getMainLooper()).pause()

    smm.enqueuePendingEvent(reactTag, "first", false, null, EventCategoryDef.UNSPECIFIED, 1L)
    assertThat(smm.hasPendingEvents(reactTag)).isTrue()

    // Caller (e.g. FabricUIManager.receiveEvent) sees a previous enqueue is still in-flight and
    // routes through enqueuePendingEvent rather than dispatching directly via the emitter.
    smm.enqueuePendingEvent(reactTag, "second", false, null, EventCategoryDef.UNSPECIFIED, 2L)

    shadowOf(Looper.getMainLooper()).idle()

    val ordered = inOrder(emitter)
    ordered.verify(emitter).dispatch("first", null, EventCategoryDef.UNSPECIFIED, 1L)
    ordered.verify(emitter).dispatch("second", null, EventCategoryDef.UNSPECIFIED, 2L)

    assertThat(smm.hasPendingEvents(reactTag)).isFalse()
  }
}
