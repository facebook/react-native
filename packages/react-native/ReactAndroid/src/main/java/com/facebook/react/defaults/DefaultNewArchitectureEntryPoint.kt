/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // We want to use ReactFeatureFlags here specifically

package com.facebook.react.defaults

import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults

/**
 * A utility class that serves as an entry point for users setup the New Architecture.
 *
 * This class needs to be invoked as `DefaultNewArchitectureEntryPoint.load(...)` by passing a
 * series of optional parameters.
 *
 * By default it loads a library called `appmodules`. `appmodules` is a convention used to refer to
 * the application dynamic library. If changed here should be updated also inside the template.
 *
 * By default it also enables both TurboModules, Fabric and Concurrent React (aka React 18), and
 * Bridgeless
 */
public object DefaultNewArchitectureEntryPoint {
  @JvmStatic
  @JvmOverloads
  public fun load(
      turboModulesEnabled: Boolean = true,
      fabricEnabled: Boolean = true,
      bridgelessEnabled: Boolean = true
  ) {
    val (isValid, errorMessage) =
        isConfigurationValid(turboModulesEnabled, fabricEnabled, bridgelessEnabled)
    if (!isValid) {
      error(errorMessage)
    }
    ReactFeatureFlags.useTurboModules = turboModulesEnabled
    ReactFeatureFlags.enableFabricRenderer = fabricEnabled
    ReactFeatureFlags.unstable_useFabricInterop = fabricEnabled
    ReactFeatureFlags.enableBridgelessArchitecture = bridgelessEnabled
    ReactFeatureFlags.useNativeViewConfigsInBridgelessMode = fabricEnabled && bridgelessEnabled
    ReactFeatureFlags.unstable_useTurboModuleInterop = bridgelessEnabled
    ReactFeatureFlags.enableFabricPendingEventQueue = fabricEnabled

    if (bridgelessEnabled) {
      ReactNativeFeatureFlags.override(
          object : ReactNativeFeatureFlagsDefaults() {
            override fun useModernRuntimeScheduler(): Boolean = true

            override fun enableMicrotasks(): Boolean = true

            override fun batchRenderingUpdatesInEventLoop(): Boolean = true

            override fun androidEnablePendingFabricTransactions(): Boolean = true
          })
    }

    privateFabricEnabled = fabricEnabled
    privateTurboModulesEnabled = turboModulesEnabled
    privateConcurrentReactEnabled = fabricEnabled
    privateBridgelessEnabled = bridgelessEnabled

    DefaultSoLoader.maybeLoadSoLibrary()
  }

  private var privateFabricEnabled: Boolean = false
  @JvmStatic
  public val fabricEnabled: Boolean
    get() = privateFabricEnabled

  private var privateTurboModulesEnabled: Boolean = false
  @JvmStatic
  public val turboModulesEnabled: Boolean
    get() = privateTurboModulesEnabled

  private var privateConcurrentReactEnabled: Boolean = false
  @JvmStatic
  public val concurrentReactEnabled: Boolean
    get() = privateConcurrentReactEnabled

  private var privateBridgelessEnabled: Boolean = false
  @JvmStatic
  public val bridgelessEnabled: Boolean
    get() = privateBridgelessEnabled

  @VisibleForTesting
  public fun isConfigurationValid(
      turboModulesEnabled: Boolean,
      fabricEnabled: Boolean,
      bridgelessEnabled: Boolean
  ): Pair<Boolean, String> =
      when {
        fabricEnabled && !turboModulesEnabled ->
            false to
                "fabricEnabled=true requires turboModulesEnabled=true (is now false) - Please update your DefaultNewArchitectureEntryPoint.load() parameters."
        bridgelessEnabled && (!turboModulesEnabled || !fabricEnabled) ->
            false to
                "bridgelessEnabled=true requires (turboModulesEnabled=true AND fabricEnabled=true) - Please update your DefaultNewArchitectureEntryPoint.load() parameters."
        else -> true to ""
      }
}
