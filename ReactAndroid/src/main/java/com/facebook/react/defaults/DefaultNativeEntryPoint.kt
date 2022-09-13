/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.soloader.SoLoader

/**
 * A utility class that serves as an entry point for users to register all the custom Fabric
 * Components and Turbo Native Modules.
 *
 * This class needs to be invoked as `DefaultNativeEntryPoint.load("...")` by passing the name of
 * the dynamic library to load.
 *
 * By default it loads a library called `appmodules`. `appmodules` is a convention used to refer to
 * the application dynamic library. If changed here should be updated also inside the template.
 */
object DefaultNativeEntryPoint {
  @JvmStatic
  @JvmOverloads
  fun load(dynamicLibraryName: String = "appmodules") {
    SoLoader.loadLibrary("react_newarchdefaults")
    SoLoader.loadLibrary(dynamicLibraryName)
  }
}
