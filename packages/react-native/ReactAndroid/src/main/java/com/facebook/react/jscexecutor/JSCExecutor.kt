/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jscexecutor

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.JavaScriptExecutor
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.soloader.SoLoader

@DoNotStrip
@LegacyArchitecture
public class JSCExecutor internal constructor(jscConfig: ReadableNativeMap) :
    JavaScriptExecutor(initHybrid(jscConfig)) {

  override fun getName(): String {
    return "JSCExecutor"
  }

  private companion object {
    init {
      loadLibrary()
      LegacyArchitectureLogger.assertLegacyArchitecture("JSCExecutor")
    }

    @JvmStatic
    @Throws(UnsatisfiedLinkError::class)
    fun loadLibrary() {
      SoLoader.loadLibrary("jscexecutor")
    }

    @JvmStatic private external fun initHybrid(jscConfig: ReadableNativeMap): HybridData
  }
}
