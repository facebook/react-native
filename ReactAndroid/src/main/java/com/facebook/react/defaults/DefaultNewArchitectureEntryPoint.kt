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
      concurrentReactEnabled: Boolean = true,
      dynamicLibraryName: String = "appmodules",
  ) {
    ReactFeatureFlags.useTurboModules = turboModulesEnabled
    ReactFeatureFlags.enableFabricRenderer = fabricEnabled

    this.fabricEnabled = fabricEnabled
    this.turboModulesEnabled = turboModulesEnabled
    this.concurrentReactEnabled = concurrentReactEnabled

    SoLoader.loadLibrary("react_newarchdefaults")
    SoLoader.loadLibrary(dynamicLibraryName)
  }

  @JvmStatic var fabricEnabled: Boolean = false

  @JvmStatic var turboModulesEnabled: Boolean = false

  @JvmStatic var concurrentReactEnabled: Boolean = false
}
