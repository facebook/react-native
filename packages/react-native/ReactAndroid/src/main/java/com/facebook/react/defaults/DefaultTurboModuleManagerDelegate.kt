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
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.runtime.cxxreactpackage.CxxReactPackage

/**
 * A utility class that allows you to simplify the setup of a
 * [ReactPackageTurboModuleManagerDelegate] for new apps in Open Source.
 *
 * This class works together with the [DefaultNewArchitectureEntryPoint] and it's C++ implementation
 * is hosted inside the React Native framework
 */
@OptIn(UnstableReactNativeAPI::class)
class DefaultTurboModuleManagerDelegate
private constructor(
    context: ReactApplicationContext,
    packages: List<ReactPackage>,
    private val eagerlyInitializedModules: List<String>,
    private val cxxReactPackage: CxxReactPackage?,
) : ReactPackageTurboModuleManagerDelegate(context, packages) {

  @DoNotStrip override fun initHybrid() = initHybrid(cxxReactPackage)

  external fun initHybrid(cxxReactPackage: CxxReactPackage?): HybridData?

  override fun getEagerInitModuleNames(): List<String> {
    if (unstable_isLazyTurboModuleDelegate()) {
      return eagerlyInitializedModules
    }

    // Use ReactModuleInfo to get the eager init module names
    return super.getEagerInitModuleNames()
  }

  class Builder : ReactPackageTurboModuleManagerDelegate.Builder() {
    private var eagerInitModuleNames: List<String> = emptyList()
    private var cxxReactPackage: CxxReactPackage? = null

    fun setEagerInitModuleNames(eagerInitModuleNames: List<String>): Builder {
      this.eagerInitModuleNames = eagerInitModuleNames
      return this
    }

    fun setCxxReactPackage(cxxReactPackage: CxxReactPackage): Builder {
      this.cxxReactPackage = cxxReactPackage
      return this
    }

    override fun build(context: ReactApplicationContext, packages: List<ReactPackage>) =
        DefaultTurboModuleManagerDelegate(context, packages, eagerInitModuleNames, cxxReactPackage)
  }

  @Synchronized
  override fun maybeLoadOtherSoLibraries() {
    DefaultSoLoader.maybeLoadSoLibrary()
  }
}
