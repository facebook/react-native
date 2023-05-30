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

/**
 * [ReactHostDelegate] is an interface that defines parameters required to initialize React Native.
 * This interface works in combination with [ReactHost]
 */
@ThreadSafe
@UnstableReactNativeAPI
interface ReactHostDelegate {
  /**
   * Path to your app's main module on Metro. This is used when reloading JS during development. All
   * paths are relative to the root folder the packager is serving files from. Examples:
   * `index.android` or `subdirectory/index.android`
   */
  val jSMainModulePath: String

  /**
   * Object that holds a native C++ references that allow host applications to install C++ objects
   * into jsi::Runtime during the initialization of React Native
   */
  val bindingsInstaller: BindingsInstaller?

  /** list of [ReactPackage] to expose Native Modules and View Components to JS */
  val reactPackages: List<ReactPackage>

  /** Object that holds a native reference to the javascript engine */
  val jSEngineInstance: JSEngineInstance

  /**
   * Bundle loader to use when setting up JS environment. <p>Example:
   * [JSBundleLoader.createFileLoader(application, bundleFile)]
   */
  val jSBundleLoader: JSBundleLoader

  /** TODO: combine getTurboModuleManagerDelegate inside [ReactPackage] */
  fun getTurboModuleManagerDelegate(context: ReactApplicationContext): TurboModuleManagerDelegate

  /**
   * Callback that can be used by React Native host applications to react to exceptions thrown by
   * the internals of React Native.
   */
  fun handleInstanceException(error: Exception)

  /**
   * ReactNative Configuration that allows to customize the behavior of key/value pairs used by the
   * framework to enable/disable experimental capabilities
   */
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
