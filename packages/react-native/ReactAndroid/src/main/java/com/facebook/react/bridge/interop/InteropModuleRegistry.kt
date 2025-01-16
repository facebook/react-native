/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.interop

import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags.enableFabricRenderer
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags.useFabricInterop

/**
 * A utility class that takes care of returning [JavaScriptModule] which are used for the Fabric
 * Interop Layer. This allows us to override the returned classes once the user is invoking
 * `ReactContext.getJsModule()`.
 *
 * Currently we only support a `RCTEventEmitter` re-implementation, being `InteropEventEmitter` but
 * this class can support other re-implementation in the future.
 */
internal class InteropModuleRegistry {
  private val supportedModules = mutableMapOf<Class<*>, Any?>()

  fun <T : JavaScriptModule?> shouldReturnInteropModule(requestedModule: Class<T>): Boolean {
    return checkReactFeatureFlagsConditions() && supportedModules.containsKey(requestedModule)
  }

  fun <T : JavaScriptModule?> getInteropModule(requestedModule: Class<T>): T? {
    return if (checkReactFeatureFlagsConditions()) {
      @Suppress("UNCHECKED_CAST")
      supportedModules[requestedModule] as? T?
    } else {
      null
    }
  }

  fun <T : JavaScriptModule?> registerInteropModule(
      interopModuleInterface: Class<T>,
      interopModule: Any
  ) {
    if (checkReactFeatureFlagsConditions()) {
      supportedModules[interopModuleInterface] = interopModule
    }
  }

  private fun checkReactFeatureFlagsConditions(): Boolean =
      enableFabricRenderer() && useFabricInterop()
}
