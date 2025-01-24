/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.reactexecutor

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.react.bridge.JavaScriptExecutor
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.soloader.SoLoader

public class HermesExecutor internal constructor(enableDebugger: Boolean, debuggerName: String) :
    JavaScriptExecutor(initHybridDefaultConfig(enableDebugger, debuggerName)) {

  override fun getName(): String = "HermesExecutor$mode"

  public companion object {
    private var mode: String? = null

    init {
      loadLibrary()
    }

    @JvmStatic
    @Throws(UnsatisfiedLinkError::class)
    public fun loadLibrary() {
      if (mode == null) {
        // libhermes must be loaded explicitly to invoke its JNI_OnLoad.
        SoLoader.loadLibrary("hermes")
        SoLoader.loadLibrary("hermes_executor")
        // libhermes_executor is built differently for Debug & Release so we load the proper mode.
        mode = if (ReactBuildConfig.DEBUG) "Debug" else "Release"
      }
    }

    @DoNotStrip
    @JvmStatic
    private external fun initHybridDefaultConfig(
        enableDebugger: Boolean,
        debuggerName: String
    ): HybridData?

    @DoNotStrip
    @JvmStatic
    private external fun initHybrid(
        enableDebugger: Boolean,
        debuggerName: String,
        heapSizeMB: Long
    ): HybridData?
  }
}
