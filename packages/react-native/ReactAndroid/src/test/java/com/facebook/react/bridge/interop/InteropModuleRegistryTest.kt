/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress(
    "DEPRECATION") // Suppressing as we want to test specifically with RCTEventEmitter here

package com.facebook.react.bridge.interop

import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.modules.core.JSTimers
import com.facebook.react.uimanager.events.RCTEventEmitter
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test

@OptIn(UnstableReactNativeAPI::class)
class InteropModuleRegistryTest {

  lateinit var underTest: InteropModuleRegistry

  @Before
  fun setup() {
    underTest = InteropModuleRegistry()
  }

  @Test
  fun shouldReturnInteropModule_withFabricDisabled_returnsFalse() {
    ReactFeatureFlags.enableFabricRenderer = false

    assertThat(underTest.shouldReturnInteropModule(RCTEventEmitter::class.java)).isFalse()
  }

  @Test
  fun shouldReturnInteropModule_withFabricInteropDisabled_returnsFalse() {
    ReactFeatureFlags.enableFabricRenderer = true
    ReactFeatureFlags.unstable_useFabricInterop = false

    assertThat(underTest.shouldReturnInteropModule(RCTEventEmitter::class.java)).isFalse()
  }

  @Test
  fun shouldReturnInteropModule_withUnregisteredClass_returnsFalse() {
    ReactFeatureFlags.enableFabricRenderer = true
    ReactFeatureFlags.unstable_useFabricInterop = true

    assertThat(underTest.shouldReturnInteropModule(JSTimers::class.java)).isFalse()
  }

  @Test
  fun shouldReturnInteropModule_withRegisteredClass_returnsTrue() {
    ReactFeatureFlags.enableFabricRenderer = true
    ReactFeatureFlags.unstable_useFabricInterop = true

    underTest.registerInteropModule(RCTEventEmitter::class.java, FakeRCTEventEmitter())

    assertThat(underTest.shouldReturnInteropModule(RCTEventEmitter::class.java)).isTrue()
  }

  @Test
  fun getInteropModule_withRegisteredClassAndInvalidFlags_returnsNull() {
    ReactFeatureFlags.enableFabricRenderer = false
    ReactFeatureFlags.unstable_useFabricInterop = false
    underTest.registerInteropModule(RCTEventEmitter::class.java, FakeRCTEventEmitter())

    val interopModule = underTest.getInteropModule(RCTEventEmitter::class.java)

    assertThat(interopModule).isNull()
  }

  @Test
  fun getInteropModule_withRegisteredClassAndValidFlags_returnsInteropModule() {
    ReactFeatureFlags.enableFabricRenderer = true
    ReactFeatureFlags.unstable_useFabricInterop = true
    underTest.registerInteropModule(RCTEventEmitter::class.java, FakeRCTEventEmitter())

    val interopModule = underTest.getInteropModule(RCTEventEmitter::class.java)

    assertThat(interopModule).isInstanceOf(FakeRCTEventEmitter::class.java)
  }

  @Test
  fun getInteropModule_withUnregisteredClass_returnsNull() {
    ReactFeatureFlags.enableFabricRenderer = true
    ReactFeatureFlags.unstable_useFabricInterop = true
    val missingModule = underTest.getInteropModule(JSTimers::class.java)

    assertThat(missingModule).isNull()
  }
}
