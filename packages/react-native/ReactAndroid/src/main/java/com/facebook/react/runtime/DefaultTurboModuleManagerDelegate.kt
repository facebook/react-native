/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.runtime.cxxreactpackage.CxxReactPackage
import com.facebook.soloader.SoLoader

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
    cxxReactPackages: List<CxxReactPackage>,
) : ReactPackageTurboModuleManagerDelegate(context, packages, initHybrid(cxxReactPackages)) {

  override fun initHybrid(): HybridData {
    throw UnsupportedOperationException(
        "DefaultTurboModuleManagerDelegate.initHybrid() must never be called!")
  }

  class Builder : ReactPackageTurboModuleManagerDelegate.Builder() {
    private var cxxReactPackageProviders:
        MutableList<((context: ReactApplicationContext) -> List<CxxReactPackage>)> =
        mutableListOf()

    fun addCxxReactPackages(
        provider: (context: ReactApplicationContext) -> List<CxxReactPackage>
    ): Builder {
      cxxReactPackageProviders.add(provider)
      return this
    }

    override fun build(
        context: ReactApplicationContext,
        packages: List<ReactPackage>
    ): DefaultTurboModuleManagerDelegate {
      val cxxReactPackages =
          cxxReactPackageProviders.map { provider -> provider(context) }.flatten()

      return DefaultTurboModuleManagerDelegate(context, packages, cxxReactPackages)
    }
  }

  companion object {
    init {
      // loads the DefaultTurboModuleManagerDelegate.cpp
      SoLoader.loadLibrary("react_defaults")
    }

    @DoNotStrip
    @JvmStatic
    external fun initHybrid(cxxReactPackages: List<CxxReactPackage>): HybridData
  }
}
