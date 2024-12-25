/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.events.BatchEventDispatchedListener
import com.facebook.testutils.fakes.FakeBatchEventDispatchedListener
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class FabricUIManagerTest {

  private lateinit var reactContext: ReactApplicationContext
  private lateinit var viewManagerRegistry: ViewManagerRegistry
  private lateinit var batchEventDispatchedListener: BatchEventDispatchedListener
  private lateinit var underTest: FabricUIManager
  private lateinit var featureFlags: MockedStatic<ReactNativeFeatureFlags>

  @Before
  fun setup() {
    featureFlags = Mockito.mockStatic(ReactNativeFeatureFlags::class.java)
    featureFlags.`when`<Boolean> { ReactNativeFeatureFlags.enableFabricLogs() }.thenAnswer { false }
    reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
    viewManagerRegistry = ViewManagerRegistry(emptyList())
    batchEventDispatchedListener = FakeBatchEventDispatchedListener()
    underTest = FabricUIManager(reactContext, viewManagerRegistry, batchEventDispatchedListener)
  }

  @After
  fun teardown() {
    featureFlags.close()
  }

  @Test
  fun createDispatchCommandMountItemForInterop_withValidString_returnsStringEvent() {
    val command = underTest.createDispatchCommandMountItemForInterop(11, 1, "anEvent", null)

    // DispatchStringCommandMountItem is package private so we can `as` check it.
    val className = command::class.java.name.substringAfterLast(".")
    assertThat(className).isEqualTo("DispatchStringCommandMountItem")
  }

  @Test
  fun createDispatchCommandMountItemForInterop_withValidInt_returnsIntEvent() {
    val command = underTest.createDispatchCommandMountItemForInterop(11, 1, "42", null)

    // DispatchIntCommandMountItem is package private so we can `as` check it.
    val className = command::class.java.name.substringAfterLast(".")
    assertThat(className).isEqualTo("DispatchIntCommandMountItem")
  }
}
