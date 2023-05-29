/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.jni.annotations.DoNotStrip
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

/**
 * A utility class that allows you to simplify the initialization of React Native by setting up a
 * [ReactHostDelegate] that uses recommended dependencies.
 *
 * @param jSMainModulePath Path to your app's main module on Metro. This is used when reloading JS
 *   during development. All paths are relative to the root folder the packager is serving files
 *   from. Examples: `index.android` or `subdirectory/index.android`
 * @param jSBundleLoader Bundle loader to use when setting up JS environment. <p>Example:
 *   [JSBundleLoader.createFileLoader(application, bundleFile)]
 * @param reactPackages list of reactPackages to expose Native Modules and View Components to JS
 * @param jSEngineInstance Object that holds a native reference to the javascript engine
 * @param bindingsInstaller Object that holds a native C++ references that allow host applications
 *   to install C++ objects into jsi::Runtime during the initialization of React Native
 * @param reactNativeConfig ReactNative Configuration that allows to customize the behavior of
 *   key/value pairs used by the framework to enable/disable experimental capabilities
 * @param exceptionHandler Callback that can be used by React Native host applications to react to
 *   exceptions thrown by the internals of React Native.
 */
@DoNotStrip
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
