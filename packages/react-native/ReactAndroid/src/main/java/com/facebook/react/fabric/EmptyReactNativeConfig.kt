/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny

/**
 * An empty [ReactNativeConfig] that is backed by the C++ implementation where the defaults are
 * stored.
 */
@DoNotStripAny
public class EmptyReactNativeConfig : ReactNativeConfig {
  private val mHybridData: HybridData = initHybrid()

  private external fun initHybrid(): HybridData

  private companion object {
    init {
      FabricSoLoader.staticInit()
    }
  }
}
