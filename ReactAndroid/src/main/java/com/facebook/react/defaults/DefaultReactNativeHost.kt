/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import android.app.Application
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSIModulePackage

/**
 * A utility class that allows you to simplify the setup of a [ReactNativeHost] for new apps in Open
 * Source.
 *
 * Specifically, for apps that are using the New Architecture, this Default class takes care of
 * providing the default TurboModuleManagerDelegateBuilder and the default JSIModulePackage,
 * provided the name of the dynamic library to load.
 */
abstract class DefaultReactNativeHost protected constructor(application: Application) :
    ReactNativeHost(application) {

  protected override fun getReactPackageTurboModuleManagerDelegateBuilder():
      ReactPackageTurboModuleManagerDelegate.Builder? =
      dynamicLibraryName?.let {
        // If the user provided a dynamic library name, we assume they want to load
        // the default ReactPackageTurboModuleManagerDelegate
        DefaultTurboModuleManagerDelegate.Builder(it)
      }

  protected override fun getJSIModulePackage(): JSIModulePackage? =
      dynamicLibraryName?.let {
        // If the user provided a dynamic library name, we assume they want to load
        // the default JSIModulePackage
        DefaultJSIModulePackage(this)
      }

  /**
   * Returns the name of the dynamic library used by app on the New Architecture. This is generally
   * "<applicationname>_appmodules" or just "appmodules"
   *
   * If null, we will assume you're not using the New Architecture and will not attempt to load any
   * dynamic library at runtime.
   *
   * If set, we'll take care of create a TurboModuleManagerDelegate that will load the library you
   * specified.
   */
  protected open val dynamicLibraryName: String?
    get() = null
}
