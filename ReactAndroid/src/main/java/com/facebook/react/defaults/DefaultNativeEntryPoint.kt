/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

/**
 * A utility class that serves as an entry point for users to register all the custom Fabric
 * Components and Turbo Native Modules.
 *
 * This class needs to be invoked as `DefaultNativeEntryPoint.load("...")` by passing the name of
 * the dynamic library to load.
 *
 * This class works together with the [DefaultNativeEntryPoint] and it's C++ implementation is
 * hosted inside the React Native framework
 */
@DoNotStrip
class DefaultNativeEntryPoint @DoNotStrip private constructor() {

  @DoNotStrip private val hybridData: HybridData = initHybrid()

  @DoNotStrip private external fun initHybrid(): HybridData

  companion object {
    @JvmStatic
    fun load(dynamicLibraryName: String) {
      SoLoader.loadLibrary("react_newarchdefaults")
      SoLoader.loadLibrary(dynamicLibraryName)
      DefaultNativeEntryPoint()
    }
  }
}
