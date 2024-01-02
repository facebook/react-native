/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.app.Activity
import android.content.Context
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.Mockito
import org.mockito.Mockito.doReturn
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Tests [BridgelessReactContext] */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class BridgelessReactContextTest {
  private lateinit var context: Context
  private lateinit var reactHost: ReactHostImpl
  private lateinit var bridgelessReactContext: BridgelessReactContext

  @Before
  fun setUp() {
    context = Robolectric.buildActivity(Activity::class.java).create().get()
    reactHost = Mockito.mock(ReactHostImpl::class.java)
    bridgelessReactContext = BridgelessReactContext(context, reactHost)
  }

  @Test
  fun getNativeModuleTest() {
    val mUiManagerModule = Mockito.mock(UIManagerModule::class.java)
    doReturn(mUiManagerModule)
        .`when`(reactHost)
        .getNativeModule(ArgumentMatchers.any<Class<UIManagerModule>>())
    val uiManagerModule = bridgelessReactContext.getNativeModule(UIManagerModule::class.java)
    Assertions.assertThat(uiManagerModule).isEqualTo(mUiManagerModule)
  }

  @Test
  fun getFabricUIManagerTest() {
    val fabricUiManager = Mockito.mock(FabricUIManager::class.java)
    doReturn(fabricUiManager).`when`(reactHost).uiManager
    Assertions.assertThat(bridgelessReactContext.getFabricUIManager()).isEqualTo(fabricUiManager)
  }

  @Test(expected = UnsupportedOperationException::class)
  fun getCatalystInstance_throwsException() {
    // Disable this test for now due to mocking FabricUIManager fails
    bridgelessReactContext.catalystInstance
  }
}
