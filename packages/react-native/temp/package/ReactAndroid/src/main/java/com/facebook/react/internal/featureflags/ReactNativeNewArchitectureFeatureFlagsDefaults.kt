// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
@file:Suppress("DEPRECATION") // We want to use ReactFeatureFlags here specifically

package com.facebook.react.internal.featureflags

import com.facebook.react.config.ReactFeatureFlags

/**
 * This class initializes default values for ReactNativeFeatureFlags when the New architecture is
 * enabled. This class is meant to be overrode only by internal apps migrating to the new
 * architecture.
 *
 * NOTE: Be aware that as a side effect this class also modifies static fields in {@link
 * com.facebook.react.config.ReactFeatureFlags} when newArchitectureEnabled is true.
 */
public open class ReactNativeNewArchitectureFeatureFlagsDefaults(
    private val newArchitectureEnabled: Boolean = true
) : ReactNativeFeatureFlagsDefaults() {

  init {
    if (newArchitectureEnabled) {
      // When the new architecture is enabled, we want to set the default values of the flags for
      // Fabric, TurboModules and Bridgeless as enabled by default.
      // ReactFeatureFlags is deprecated and will be deleted in 0.77, this code is temporary to
      // support the new architecture before 0.77 cut.
      ReactFeatureFlags.enableFabricRenderer = true
      ReactFeatureFlags.useTurboModules = true
      ReactFeatureFlags.enableBridgelessArchitecture = true
    }
  }

  override fun batchRenderingUpdatesInEventLoop(): Boolean =
      newArchitectureEnabled || super.batchRenderingUpdatesInEventLoop()

  override fun useTurboModuleInterop(): Boolean =
      newArchitectureEnabled || super.useTurboModuleInterop()

  override fun useModernRuntimeScheduler(): Boolean = true

  override fun enableMicrotasks(): Boolean = true

  override fun useNativeViewConfigsInBridgelessMode(): Boolean = true
}
