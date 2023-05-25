/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridgeless.BindingsInstaller
import com.facebook.react.bridgeless.JSEngineInstance
import com.facebook.react.bridgeless.ReactHostDelegate
import com.facebook.react.bridgeless.hermes.HermesInstance
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.turbomodule.core.TurboModuleManagerDelegate

@UnstableReactNativeAPI
class DefaultReactHostDelegate(
    override val jSMainModulePath: String,
    override val jSBundleLoader: JSBundleLoader,
    override val reactPackages: List<ReactPackage> = emptyList(),
    override val jSEngineInstance: JSEngineInstance = HermesInstance(),
    override val bindingsInstaller: BindingsInstaller = DefaultBindingsInstaller(),
    private val turboModuleManagerDelegate:
        (context: ReactApplicationContext) -> TurboModuleManagerDelegate,
    private val reactNativeConfig: ReactNativeConfig = ReactNativeConfig.DEFAULT_CONFIG,
    private val exceptionHandler: (Exception) -> Unit = {}
) : ReactHostDelegate {

  override fun getTurboModuleManagerDelegate(context: ReactApplicationContext) =
      turboModuleManagerDelegate(context)

  override fun getReactNativeConfig(context: ReactContext) = reactNativeConfig

  override fun handleInstanceException(error: Exception) = exceptionHandler(error)
}
