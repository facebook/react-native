/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.soloader.SoLoader

/**
 * A utility class that allows you to provide a TurboModuleManagerDelegate by just specifying the
 * name of the dynamic library. This class will take care of loading the dynamic library for you on
 * your behalf.
 *
 * Please note that you need to provide a native implementation for the method initHybrid for this
 * class, making sure the Java Descriptor is:
 * Lcom/facebook/react/defaults/DefaultTurboModuleManagerDelegate;
 */
class DefaultTurboModuleManagerDelegate
private constructor(
    dynamicLibraryName: String,
    context: ReactApplicationContext,
    packages: List<ReactPackage>
) : ReactPackageTurboModuleManagerDelegate(context, packages) {

  @DoNotStrip protected override external fun initHybrid(): HybridData?

  init {
    maybeLoadOtherSoLibraries(dynamicLibraryName)
  }

  @Synchronized
  private fun maybeLoadOtherSoLibraries(dynamicLibraryName: String) {
    // Prevents issues with initializer interruptions.
    if (!isSoLibraryLoaded) {
      SoLoader.loadLibrary(dynamicLibraryName)
      isSoLibraryLoaded = true
    }
  }

  class Builder(private val dynamicLibraryName: String) :
      ReactPackageTurboModuleManagerDelegate.Builder() {
    protected override fun build(context: ReactApplicationContext, packages: List<ReactPackage>) =
        DefaultTurboModuleManagerDelegate(dynamicLibraryName, context, packages)
  }

  companion object {
    @Volatile private var isSoLibraryLoaded = false
  }
}
