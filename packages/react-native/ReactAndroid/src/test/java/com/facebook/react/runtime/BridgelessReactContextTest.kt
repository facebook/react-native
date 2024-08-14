/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.app.Activity
import android.content.Context
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowNativeArray
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers
import org.mockito.Mockito.doReturn
import org.mockito.Mockito.eq
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Tests [BridgelessReactContext] */
@RunWith(RobolectricTestRunner::class)
@Config(
    shadows = [ShadowSoLoader::class, ShadowArguments::class, ShadowNativeArray.Writable::class])
class BridgelessReactContextTest {
  private lateinit var context: Context
  private lateinit var reactHost: ReactHostImpl
  private lateinit var bridgelessReactContext: BridgelessReactContext

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = Robolectric.buildActivity(Activity::class.java).create().get()
    reactHost = mock(ReactHostImpl::class.java)
    bridgelessReactContext = BridgelessReactContext(context, reactHost)
  }

  @Test
  fun getNativeModuleTest() {
    val mUiManagerModule = mock(UIManagerModule::class.java)
    doReturn(mUiManagerModule)
        .`when`(reactHost)
        .getNativeModule(ArgumentMatchers.any<Class<UIManagerModule>>())
    val uiManagerModule = bridgelessReactContext.getNativeModule(UIManagerModule::class.java)
    assertThat(uiManagerModule).isEqualTo(mUiManagerModule)
  }

  @Test
  fun getFabricUIManagerTest() {
    val fabricUiManager = mock(FabricUIManager::class.java)
    doReturn(fabricUiManager).`when`(reactHost).uiManager
    assertThat(bridgelessReactContext.getFabricUIManager()).isEqualTo(fabricUiManager)
  }

  @Test
  fun getCatalystInstanceTest() {
    assertThat(bridgelessReactContext.getCatalystInstance())
        .isInstanceOf(BridgelessCatalystInstance::class.java)
  }

  @Test
  fun testEmitDeviceEvent() {
    bridgelessReactContext.emitDeviceEvent("onNetworkResponseReceived", mapOf("foo" to "bar"))

    val argsCapture = ArgumentCaptor.forClass(WritableNativeArray::class.java)
    verify(reactHost, times(1))
        .callFunctionOnModule(eq("RCTDeviceEventEmitter"), eq("emit"), argsCapture.capture())

    val argsList = ShadowNativeArray.getContents(argsCapture.value)
    assertThat(argsList[0]).isEqualTo("onNetworkResponseReceived")
    @Suppress("UNCHECKED_CAST") assertThat((argsList[1] as Map<Any, Any>)["foo"]).isEqualTo("bar")
  }
}
