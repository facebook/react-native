/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless

import android.content.Context
import com.facebook.infer.annotation.ThreadSafe
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.turbomodule.core.TurboModuleManager
import com.facebook.react.turbomodule.core.TurboModuleManagerDelegate

/** TODO: add javadoc for class and methods */
@ThreadSafe
interface ReactInstanceDelegate {
  val jSMainModulePath: String

  val bindingsInstaller: BindingsInstaller

  val reactPackages: List<ReactPackage>

  fun getJSBundleLoader(context: Context): JSBundleLoader

  fun getTurboModuleManagerDelegate(context: ReactApplicationContext): TurboModuleManagerDelegate

  fun getJSEngineInstance(context: ReactApplicationContext): JSEngineInstance

  fun handleInstanceException(e: Exception)

  fun getReactNativeConfig(turboModuleManager: TurboModuleManager): ReactNativeConfig

  class ReactInstanceDelegateBase(
      override val jSMainModulePath: String,
      override val bindingsInstaller: BindingsInstaller,
      override val reactPackages: List<ReactPackage>,
      private val jsBundleLoader: JSBundleLoader,
      private val turboModuleManagerDelegate: TurboModuleManagerDelegate,
      private val jsEngineInstance: JSEngineInstance,
      private val reactNativeConfig: ReactNativeConfig,
      private val exceptionHandler: (Exception) -> Unit = {}
  ) : ReactInstanceDelegate {
    override fun getJSBundleLoader(context: Context) = jsBundleLoader

    override fun getTurboModuleManagerDelegate(context: ReactApplicationContext) =
        turboModuleManagerDelegate

    override fun getJSEngineInstance(context: ReactApplicationContext) = jsEngineInstance

    override fun getReactNativeConfig(turboModuleManager: TurboModuleManager) = reactNativeConfig

    override fun handleInstanceException(e: Exception) = exceptionHandler(e)
  }
}
