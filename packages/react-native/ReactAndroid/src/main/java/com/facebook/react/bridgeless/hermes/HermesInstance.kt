/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless.hermes

import com.facebook.common.process.ProcessName
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.jsi.mdcd.HermesCodeCoverage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridgeless.JSEngineInstance
import com.facebook.soloader.SoLoader
import kotlin.jvm.JvmStatic

class HermesInstance(context: ReactApplicationContext) : JSEngineInstance(initHybrid()!!) {

  companion object {
    @JvmStatic @DoNotStrip protected external fun initHybrid(): HybridData?

    init {
      SoLoader.loadLibrary("hermesinstancejni")
    }
  }

  init {
    // Initialize Code Coverage tracing for select usecases, like E2E coverage and Hermes MDCD
    val processName = ProcessName.current().fullName
    HermesCodeCoverage.initialize(context, processName.orEmpty())
  }
}
