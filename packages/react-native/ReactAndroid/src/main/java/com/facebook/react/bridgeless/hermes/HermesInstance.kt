/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless.hermes

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.react.bridgeless.JSEngineInstance
import com.facebook.soloader.SoLoader
import kotlin.jvm.JvmStatic

class HermesInstance() : JSEngineInstance(initHybrid()!!) {

  companion object {
    @JvmStatic @DoNotStrip protected external fun initHybrid(): HybridData?

    init {
      SoLoader.loadLibrary("hermesinstancejni")
    }
  }
}
