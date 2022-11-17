/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import android.app.Application
import com.facebook.react.JSEngineResolutionAlgorithm
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
abstract class DefaultReactNativeHost
protected constructor(
    application: Application,
) : ReactNativeHost(application) {

  override fun getReactPackageTurboModuleManagerDelegateBuilder():
      ReactPackageTurboModuleManagerDelegate.Builder? =
      if (isNewArchEnabled) {
        DefaultTurboModuleManagerDelegate.Builder()
      } else {
        null
      }

  override fun getJSIModulePackage(): JSIModulePackage? =
      if (isNewArchEnabled) {
        DefaultJSIModulePackage(this)
      } else {
        null
      }

  override fun getJSEngineResolutionAlgorithm(): JSEngineResolutionAlgorithm? =
      when (isHermesEnabled) {
        true -> JSEngineResolutionAlgorithm.HERMES
        false -> JSEngineResolutionAlgorithm.JSC
        null -> null
      }

  /**
   * Returns whether the user wants to use the New Architecture or not.
   *
   * If true, we will load the default JSI Module Package and TurboModuleManagerDelegate needed to
   * enable the New Architecture
   *
   * If false, the app will not attempt to load the New Architecture modules.
   */
  protected open val isNewArchEnabled: Boolean
    get() = false

  /**
   * Returns whether the user wants to use Hermes.
   *
   * If true, the app will load the Hermes engine, and fail if not found. If false, the app will
   * load the JSC engine, and fail if not found. If null, the app will attempt to load JSC first and
   * fallback to Hermes if not found.
   */
  protected open val isHermesEnabled: Boolean?
    get() = null
}
