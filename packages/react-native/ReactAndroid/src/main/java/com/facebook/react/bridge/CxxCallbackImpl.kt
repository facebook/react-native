/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/** Callback impl that calls directly into the cxx bridge. Created from C++. */
@DoNotStrip
@LegacyArchitecture
public class CxxCallbackImpl @DoNotStrip private constructor() : HybridClassBase(), Callback {

  override fun invoke(vararg args: Any?) {
    nativeInvoke(Arguments.fromJavaArgs(args))
  }

  private external fun nativeInvoke(arguments: NativeArray)

  private companion object {
    init {
      LegacyArchitectureLogger.assertWhenLegacyArchitectureMinifyingEnabled("CxxCallbackImpl")
    }
  }
}
