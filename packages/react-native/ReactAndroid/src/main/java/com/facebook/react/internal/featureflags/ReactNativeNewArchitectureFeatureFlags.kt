/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.featureflags

import com.facebook.infer.annotation.Assertions
import com.facebook.react.common.build.ReactBuildConfig

public object ReactNativeNewArchitectureFeatureFlags {

  @JvmStatic
  public fun isNewArchitectureStrictModeEnabled(): Boolean =
      ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE

  @JvmStatic
  public fun enableBridgelessArchitecture(): Boolean {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      Assertions.assertCondition(
          ReactNativeFeatureFlags.enableBridgelessArchitecture(),
          "ReactNativeFeatureFlags.enableBridgelessArchitecture() should be set to true when Strict Mode is enabled")
      return true
    }
    return ReactNativeFeatureFlags.enableBridgelessArchitecture()
  }

  @JvmStatic
  public fun enableFabricRenderer(): Boolean {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      Assertions.assertCondition(
          ReactNativeFeatureFlags.enableFabricRenderer(),
          "ReactNativeFeatureFlags.enableFabricRenderer() should be set to true when Strict Mode is enabled")
      return true
    }
    return ReactNativeFeatureFlags.enableFabricRenderer()
  }

  @JvmStatic
  public fun useFabricInterop(): Boolean {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      Assertions.assertCondition(
          !ReactNativeFeatureFlags.useFabricInterop(),
          "ReactNativeFeatureFlags.useFabricInterop() should be set to FALSE when Strict Mode is enabled")
      return false
    }
    return ReactNativeFeatureFlags.useFabricInterop()
  }

  @JvmStatic
  public fun useTurboModuleInterop(): Boolean {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      Assertions.assertCondition(
          !ReactNativeFeatureFlags.useTurboModuleInterop(),
          "ReactNativeFeatureFlags.useTurboModuleInterop() should be set to FALSE when Strict Mode is enabled")
      return false
    }
    return ReactNativeFeatureFlags.useTurboModuleInterop()
  }

  @JvmStatic
  public fun useTurboModules(): Boolean {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      Assertions.assertCondition(
          ReactNativeFeatureFlags.useTurboModules(),
          "ReactNativeFeatureFlags.useTurboModules() should be set to FALSE when Strict Mode is enabled")
      return true
    }
    return ReactNativeFeatureFlags.useTurboModules()
  }
}
