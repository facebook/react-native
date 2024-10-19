/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // We want to use ReactFeatureFlags here specifically

package com.facebook.react.internal.featureflags

/**
 * This class initializes default values for ReactNativeFeatureFlags when the New architecture is
 * enabled. This class is meant to be overrode only by internal apps migrating to the new
 * architecture.
 *
 * NOTE: Be aware that as a side effect this class also modifies static fields in {@link
 * com.facebook.react.config.ReactFeatureFlags} when newArchitectureEnabled is true.
 *
 * When the new architecture is enabled, we want to set the default values of the flags for Fabric,
 * TurboModules and Bridgeless as enabled by default.
 */
public open class ReactNativeNewArchitectureFeatureFlagsDefaults(
    private val newArchitectureEnabled: Boolean = true
) : ReactNativeFeatureFlagsDefaults() {
  override fun enableBridgelessArchitecture(): Boolean = newArchitectureEnabled

  override fun enableFabricRenderer(): Boolean = newArchitectureEnabled

  override fun useFabricInterop(): Boolean = newArchitectureEnabled

  override fun useNativeViewConfigsInBridgelessMode(): Boolean =
      newArchitectureEnabled || super.useNativeViewConfigsInBridgelessMode()

  override fun useTurboModuleInterop(): Boolean =
      newArchitectureEnabled || super.useTurboModuleInterop()

  override fun useTurboModules(): Boolean = newArchitectureEnabled
}
