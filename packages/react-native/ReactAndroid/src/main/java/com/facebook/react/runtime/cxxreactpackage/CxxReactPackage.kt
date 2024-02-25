/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO(170197717): Consider moving this to runtime.cxx, or just runtime
package com.facebook.react.runtime.cxxreactpackage

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.soloader.SoLoader

/** CxxReactPackage is used to register C++ Turbo Modules with React Native. */
@UnstableReactNativeAPI()
public abstract class CxxReactPackage {

  @DoNotStrip @Suppress("NoHungarianNotation") private var mHybridData: HybridData?

  protected constructor(hybridData: HybridData?) {
    mHybridData = hybridData
  }

  private companion object {
    init {
      SoLoader.loadLibrary("react_cxxreactpackage")
    }
  }
}
