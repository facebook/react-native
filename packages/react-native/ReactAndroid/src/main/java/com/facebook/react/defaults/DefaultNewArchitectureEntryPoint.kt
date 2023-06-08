/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.react.config.ReactFeatureFlags
import com.facebook.soloader.SoLoader

/**
 * A utility class that serves as an entry point for users setup the New Architecture.
 *
 * This class needs to be invoked as `DefaultNewArchitectureEntryPoint.load(...)` by passing a
 * series of optional parameters.
 *
 * By default it loads a library called `appmodules`. `appmodules` is a convention used to refer to
 * the application dynamic library. If changed here should be updated also inside the template.
 *
 * By default it also enables both TurboModules, Fabric and Concurrent React (aka React 18)
 */
object DefaultNewArchitectureEntryPoint {
  @JvmStatic
  @JvmOverloads
  fun load(
      turboModulesEnabled: Boolean = true,
      fabricEnabled: Boolean = true,
      dynamicLibraryName: String = "appmodules",
  ) {
    ReactFeatureFlags.useTurboModules = turboModulesEnabled
    ReactFeatureFlags.enableFabricRenderer = fabricEnabled
    ReactFeatureFlags.unstable_useFabricInterop = fabricEnabled

    this.privateFabricEnabled = fabricEnabled
    this.privateTurboModulesEnabled = turboModulesEnabled
    this.privateConcurrentReactEnabled = fabricEnabled

    SoLoader.loadLibrary("react_newarchdefaults")
    SoLoader.loadLibrary(dynamicLibraryName)
  }

  @Deprecated(
      message =
          "Calling DefaultNewArchitectureEntryPoint.load() with different fabricEnabled and concurrentReactEnabled is deprecated. Please use a single flag for both Fabric and Concurrent React",
      replaceWith = ReplaceWith("load(turboModulesEnabled, fabricEnabled, dynamicLibraryName)"),
      level = DeprecationLevel.WARNING)
  fun load(
      turboModulesEnabled: Boolean = true,
      fabricEnabled: Boolean = true,
      @Suppress("UNUSED_PARAMETER") concurrentReactEnabled: Boolean = true,
      dynamicLibraryName: String = "appmodules",
  ) {
    load(turboModulesEnabled, fabricEnabled, dynamicLibraryName)
  }

  private var privateFabricEnabled: Boolean = false
  @JvmStatic
  val fabricEnabled: Boolean
    get() = privateFabricEnabled

  private var privateTurboModulesEnabled: Boolean = false
  @JvmStatic
  val turboModulesEnabled: Boolean
    get() = privateTurboModulesEnabled

  private var privateConcurrentReactEnabled: Boolean = false
  @JvmStatic
  val concurrentReactEnabled: Boolean
    get() = privateConcurrentReactEnabled
}
