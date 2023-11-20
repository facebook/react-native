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

/**
 * A utility class that allows you to simplify the setup of a
 * [ReactPackageTurboModuleManagerDelegate] for new apps in Open Source.
 *
 * This class works together with the [DefaultNewArchitectureEntryPoint] and it's C++ implementation
 * is hosted inside the React Native framework
 */
class DefaultTurboModuleManagerDelegate
private constructor(
    context: ReactApplicationContext,
    packages: List<ReactPackage>,
    private val eagerlyInitializedModules: List<String>,
) : ReactPackageTurboModuleManagerDelegate(context, packages) {

  @DoNotStrip external override fun initHybrid(): HybridData?

  override fun getEagerInitModuleNames(): List<String> {
    if (unstable_isLazyTurboModuleDelegate()) {
      return eagerlyInitializedModules
    }

    // Use ReactModuleInfo to get the eager init module names
    return super.getEagerInitModuleNames()
  }

  class Builder : ReactPackageTurboModuleManagerDelegate.Builder() {
    private var eagerInitModuleNames: List<String> = emptyList()

    fun setEagerInitModuleNames(eagerInitModuleNames: List<String>): Builder {
      this.eagerInitModuleNames = eagerInitModuleNames
      return this
    }

    override fun build(context: ReactApplicationContext, packages: List<ReactPackage>) =
        DefaultTurboModuleManagerDelegate(context, packages, eagerInitModuleNames)
  }
}
