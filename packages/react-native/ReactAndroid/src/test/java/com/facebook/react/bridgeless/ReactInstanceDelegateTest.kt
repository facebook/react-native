/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.turbomodule.core.TurboModuleManagerDelegate
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@UnstableReactNativeAPI
@Config(shadows = [ShadowSoLoader::class])
class ReactInstanceDelegateTest {
  @Test
  fun testReactInstanceDelegateCreation() {
    val jsBundleLoader: JSBundleLoader = Mockito.mock(JSBundleLoader::class.java)
    val reactPackage: ReactPackage = Mockito.mock(ReactPackage::class.java)
    val bindingsInstallerMock: BindingsInstaller = Mockito.mock(BindingsInstaller::class.java)
    val turboModuleManagerDelegateMock: TurboModuleManagerDelegate =
        Mockito.mock(TurboModuleManagerDelegate::class.java)
    val jsEngineInstanceMock: JSEngineInstance = Mockito.mock(JSEngineInstance::class.java)
    val reactNativeConfigMock: ReactNativeConfig = Mockito.mock(ReactNativeConfig::class.java)
    val reactPackages = listOf(reactPackage)
    val jsMainModulePathMocked = "mockedJSMainModulePath"
    val delegate =
        ReactInstanceDelegate.ReactInstanceDelegateBase(
            jsMainModulePathMocked,
            jsBundleLoader = jsBundleLoader,
            reactPackages = reactPackages,
            bindingsInstaller = bindingsInstallerMock,
            jsEngineInstance = jsEngineInstanceMock,
            reactNativeConfig = reactNativeConfigMock,
            turboModuleManagerDelegate = turboModuleManagerDelegateMock,
            exceptionHandler = {})

    assertThat(delegate.jSMainModulePath).isEqualTo(jsMainModulePathMocked)
  }
}
