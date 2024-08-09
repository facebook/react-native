/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import android.content.Context
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler
import com.facebook.react.runtime.JSCInstance
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance

/**
 * A utility class that allows you to simplify the setup of a [ReactHost] for new apps in Open
 * Source.
 *
 * [ReactHost] is an interface responsible of handling the lifecycle of a React Native app when
 * running in bridgeless mode.
 */
public object DefaultReactHost {
  private var reactHost: ReactHost? = null

  /**
   * Util function to create a default [ReactHost] to be used in your application. This method is
   * used by the New App template.
   *
   * @param context the Android [Context] to use for creating the [ReactHost]
   * @param packageList the list of [ReactPackage]s to use for creating the [ReactHost]
   * @param jsMainModulePath the path to your app's main module on Metro. Usually `index` or
   *   `index.<platform>`
   * @param jsBundleAssetPath the path to the JS bundle relative to the assets directory. Will be
   *   composed in a `asset://...` URL
   * @param isHermesEnabled whether to use Hermes as the JS engine, default to true.
   */
  @OptIn(UnstableReactNativeAPI::class)
  @JvmStatic
  public fun getDefaultReactHost(
      context: Context,
      packageList: List<ReactPackage>,
      jsMainModulePath: String = "index",
      jsBundleAssetPath: String = "index",
      isHermesEnabled: Boolean = true
  ): ReactHost {
    if (reactHost == null) {
      val jsBundleLoader =
          JSBundleLoader.createAssetLoader(context, "assets://$jsBundleAssetPath", true)
      val jsRuntimeFactory = if (isHermesEnabled) HermesInstance() else JSCInstance()
      val defaultReactHostDelegate =
          DefaultReactHostDelegate(
              jsMainModulePath = jsMainModulePath,
              jsBundleLoader = jsBundleLoader,
              reactPackages = packageList,
              jsRuntimeFactory = jsRuntimeFactory,
              turboModuleManagerDelegateBuilder = DefaultTurboModuleManagerDelegate.Builder())
      val reactJsExceptionHandler = ReactJsExceptionHandler { _ -> }
      val componentFactory = ComponentFactory()
      DefaultComponentsRegistry.register(componentFactory)
      // TODO: T164788699 find alternative of accessing ReactHostImpl for initialising reactHost
      reactHost =
          ReactHostImpl(
                  context,
                  defaultReactHostDelegate,
                  componentFactory,
                  true,
                  reactJsExceptionHandler,
                  true)
              .apply {
                jsEngineResolutionAlgorithm =
                    if (isHermesEnabled) {
                      JSEngineResolutionAlgorithm.HERMES
                    } else {
                      JSEngineResolutionAlgorithm.JSC
                    }
              }
    }
    return reactHost as ReactHost
  }

  /**
   * Util function to create a default [ReactHost] to be used in your application. This method is
   * used by the New App template.
   *
   * This method takes in input a [ReactNativeHost] (bridge-mode) and uses its configuration to
   * create an equivalent [ReactHost] (bridgeless-mode).
   *
   * @param context the Android [Context] to use for creating the [ReactHost]
   * @param reactNativeHost the [ReactNativeHost] to use for creating the [ReactHost]
   */
  @JvmStatic
  public fun getDefaultReactHost(
      context: Context,
      reactNativeHost: ReactNativeHost,
  ): ReactHost {
    require(reactNativeHost is DefaultReactNativeHost) {
      "You can call getDefaultReactHost only with instances of DefaultReactNativeHost"
    }
    return reactNativeHost.toReactHost(context)
  }
}
