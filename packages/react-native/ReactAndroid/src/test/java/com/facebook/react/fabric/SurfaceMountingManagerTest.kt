/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.fabric

import com.facebook.react.ReactRootView
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.views.view.ReactViewManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Tests for [SurfaceMountingManager] view lifecycle around preallocateView, deleteView, and
 * createView.
 *
 * The key scenario is the interaction between view preallocation and destroyUnmountedShadowNode
 * (D98729251): when a preallocated view is destroyed (e.g. from a superseded concurrent render),
 * and then a new Create mount item is emitted for the same tag, the view must be recreated.
 *
 * NOTE: These tests verify Java-side behavior only. The C++ fix in FabricMountingManager (erasing
 * from allocatedViewRegistry_ in destroyUnmountedShadowNode) ensures the Create mount item is
 * emitted in the first place. That behavior requires native code and is not testable via
 * Robolectric.
 *
 * See T223288217.
 */
@RunWith(RobolectricTestRunner::class)
class SurfaceMountingManagerTest {
  private lateinit var mountingManager: MountingManager
  private lateinit var themedReactContext: ThemedReactContext
  private val surfaceId = 1

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

  private fun startSurface(): SurfaceMountingManager {
    val rootView = ReactRootView(themedReactContext)
    mountingManager.startSurface(surfaceId, themedReactContext, rootView)
    return mountingManager.getSurfaceManagerEnforced(surfaceId, "test")
  }

  @Test
  fun preallocateView_createsView() {
    val smm = startSurface()
    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    assertThat(smm.getViewExists(42)).isTrue()
  }

  @Test
  fun deleteView_removesPreallocatedView() {
    val smm = startSurface()
    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    smm.deleteView(42)
    assertThat(smm.getViewExists(42)).isFalse()
  }

  /**
   * Verifies the Java side of the scenario fixed by D98729251:
   * 1. preallocateView creates the view
   * 2. deleteView removes it (simulating destroyUnmountedShadowNode)
   * 3. createView recreates it (the C++ fix ensures this Create is actually emitted)
   * 4. addViewAt succeeds with the recreated view
   */
  @Test
  fun createView_succeedsAfterPreallocateAndDelete() {
    val smm = startSurface()

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    assertThat(smm.getViewExists(42)).isTrue()

    smm.deleteView(42)
    assertThat(smm.getViewExists(42)).isFalse()

    smm.createView("RCTView", 42, JavaOnlyMap.of(), null, null, true)
    assertThat(smm.getViewExists(42)).isTrue()

    smm.addViewAt(surfaceId, 42, 0)
    assertThat(smm.getView(42)).isNotNull()
  }

  /** createView is a no-op when the view already exists from preallocate (normal case). */
  @Test
  fun createView_isIdempotentWhenPreallocated() {
    val smm = startSurface()

    smm.preallocateView("RCTView", 42, JavaOnlyMap.of(), null, true)
    val viewBefore = smm.getView(42)

    smm.createView("RCTView", 42, JavaOnlyMap.of(), null, null, true)
    assertThat(smm.getView(42)).isSameAs(viewBefore)
  }
}
