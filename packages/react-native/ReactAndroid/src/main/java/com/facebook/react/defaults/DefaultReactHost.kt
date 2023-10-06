/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler
import com.facebook.react.runtime.JSCInstance
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance

@UnstableReactNativeAPI
object DefaultReactHost {
  private var reactHost: ReactHost? = null

  @JvmStatic
  fun getDefaultReactHost(
      context: Context,
      packageList: List<ReactPackage>,
      jsMainModulePath: String = "index",
      jsBundleAssetPath: String = "index",
      isHermesEnabled: Boolean = true
  ): ReactHost {
    if (reactHost == null) {
      val jsBundleLoader =
          JSBundleLoader.createAssetLoader(context, "assets://$jsBundleAssetPath", true)
      val jsEngineInstance = if (isHermesEnabled) HermesInstance() else JSCInstance()
      val defaultReactHostDelegate =
          DefaultReactHostDelegate(
              jsMainModulePath = jsMainModulePath,
              jsBundleLoader = jsBundleLoader,
              reactPackages = packageList,
              jsEngineInstance = jsEngineInstance,
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
    }
    return reactHost as ReactHost
  }
}
