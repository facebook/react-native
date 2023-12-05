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
    cxxReactPackages: List<CxxReactPackage>,
) : ReactPackageTurboModuleManagerDelegate(context, packages, initHybrid(cxxReactPackages)) {

  override fun initHybrid(): HybridData? {
    throw UnsupportedOperationException(
        "DefaultTurboModuleManagerDelegate.initHybrid() must never be called!")
  }

  override fun getEagerInitModuleNames(): List<String> {
    if (unstable_isLazyTurboModuleDelegate()) {
      return eagerlyInitializedModules
    }

    // Use ReactModuleInfo to get the eager init module names
    return super.getEagerInitModuleNames()
  }

  class Builder : ReactPackageTurboModuleManagerDelegate.Builder() {
    private var eagerInitModuleNames: List<String> = emptyList()
    private var cxxReactPackages: MutableList<CxxReactPackage> = mutableListOf()
    private var cxxReactPackageProviders:
        MutableList<((context: ReactApplicationContext) -> CxxReactPackage)> =
        mutableListOf()

    fun setEagerInitModuleNames(eagerInitModuleNames: List<String>): Builder {
      this.eagerInitModuleNames = eagerInitModuleNames
      return this
    }

    fun addCxxReactPackage(cxxReactPackage: CxxReactPackage): Builder {
      this.cxxReactPackages.add(cxxReactPackage)
      return this
    }

    /**
     * TODO(T171430145): This API was introduced because some CxxReactPackages need to use the
     *   ReactApplicationContext.
     *
     * We should consider consolidating this with addCxxReactPackage above.
     *
     * Why don't we just use this provider method for all CxxReactPackage registration?
     * 1. Not all CxxReactPackages need access to the ReactContext.
     * 2. We are not sure if this is the right way to give the ReactContext to CxxReactPackage.
     * 3. We are not even sure if CxxReactPackage is going to be long-lived.
     *
     * So, let's solve this problem later.
     */
    fun unstable_addCxxReactPackageProvider(
        provider: (context: ReactApplicationContext) -> CxxReactPackage
    ): Builder {
      this.cxxReactPackageProviders.add(provider)
      return this
    }

    override fun build(
        context: ReactApplicationContext,
        packages: List<ReactPackage>
    ): DefaultTurboModuleManagerDelegate {
      val actualCxxReactPackages = mutableListOf<CxxReactPackage>()
      actualCxxReactPackages.addAll(cxxReactPackages)
      for (cxxReactPackageProvider in cxxReactPackageProviders) {
        actualCxxReactPackages.add(cxxReactPackageProvider(context))
      }

      return DefaultTurboModuleManagerDelegate(
          context, packages, eagerInitModuleNames, actualCxxReactPackages)
    }
  }

  companion object {
    init {
      DefaultSoLoader.maybeLoadSoLibrary()
    }

    @DoNotStrip
    @JvmStatic
    external fun initHybrid(cxxReactPackages: List<CxxReactPackage>): HybridData?
  }
}
