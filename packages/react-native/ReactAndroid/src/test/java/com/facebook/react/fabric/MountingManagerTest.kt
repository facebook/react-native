/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.react.ReactRootView
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.views.view.ReactViewManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests [FabricUIManager] */
@RunWith(RobolectricTestRunner::class)
class MountingManagerTest {
  private lateinit var mountingManager: MountingManager
  private lateinit var mountItemExecutor: MountItemExecutor
  private lateinit var themedReactContext: ThemedReactContext
  private var nextRootTag = 1

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
    reactContext.initializeWithInstance(createMockCatalystInstance())
    themedReactContext = ThemedReactContext(reactContext, reactContext, null, -1)
    val viewManagers = listOf<ViewManager<*, *>>(ReactViewManager())
    mountItemExecutor = MountItemExecutor {
      // no-op
    }
    mountingManager = MountingManager(ViewManagerRegistry(viewManagers), mountItemExecutor)
  }

  @Test
  fun addRootView() {
    val reactRootView = ReactRootView(themedReactContext)
    val rootReactTag = nextRootTag++
    mountingManager.startSurface(rootReactTag, themedReactContext, reactRootView)
    assertThat(reactRootView.id).isEqualTo(rootReactTag)
  }

  @Test
  fun unableToAddRootViewTwice() {
    val reactRootView = ReactRootView(themedReactContext)
    val rootReactTag = nextRootTag++
    mountingManager.startSurface(rootReactTag, themedReactContext, reactRootView)
    assertThat(reactRootView.id).isEqualTo(rootReactTag)

    // This is now a SoftException because it indicates a race condition in starting
    // a single surface with a single View, and is concerning but not necessarily fatal.
    // To be clear: in this case we're still guaranteed a single SurfaceMountingManager
    // and therefore a single View involved.
    mountingManager.startSurface(rootReactTag, themedReactContext, reactRootView)
  }

  @Test(expected = IllegalViewOperationException::class)
  fun unableToAddHandledRootView() {
    val reactRootView = ReactRootView(themedReactContext)
    reactRootView.id = 1234567
    val rootReactTag = nextRootTag++
    mountingManager.startSurface(rootReactTag, themedReactContext, reactRootView)
  }
}
