/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless

import com.facebook.infer.annotation.ThreadSafe
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.turbomodule.core.TurboModuleManagerDelegate

/** TODO: add javadoc for class and methods */
@ThreadSafe
@UnstableReactNativeAPI
interface ReactHostDelegate {
  val jSMainModulePath: String

  val bindingsInstaller: BindingsInstaller?

  val reactPackages: List<ReactPackage>

  val jSEngineInstance: JSEngineInstance

  val jSBundleLoader: JSBundleLoader

  fun getTurboModuleManagerDelegate(context: ReactApplicationContext): TurboModuleManagerDelegate

  fun handleInstanceException(error: Exception)

  fun getReactNativeConfig(context: ReactContext): ReactNativeConfig

  @UnstableReactNativeAPI
  class ReactHostDelegateBase(
      override val jSMainModulePath: String,
      override val jSBundleLoader: JSBundleLoader,
      override val jSEngineInstance: JSEngineInstance,
      override val reactPackages: List<ReactPackage> = emptyList(),
      override val bindingsInstaller: BindingsInstaller? = null,
      private val turboModuleManagerDelegate:
          (context: ReactApplicationContext) -> TurboModuleManagerDelegate,
      private val reactNativeConfig: ReactNativeConfig = ReactNativeConfig.DEFAULT_CONFIG,
      private val exceptionHandler: (error: Exception) -> Unit = {}
  ) : ReactHostDelegate {

    override fun getTurboModuleManagerDelegate(context: ReactApplicationContext) =
        turboModuleManagerDelegate(context)

    override fun getReactNativeConfig(context: ReactContext) = reactNativeConfig

    override fun handleInstanceException(error: Exception) = exceptionHandler(error)
  }
}
