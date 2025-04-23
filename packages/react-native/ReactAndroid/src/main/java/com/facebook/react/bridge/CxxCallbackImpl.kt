/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip

/** Callback impl that calls directly into the cxx bridge. Created from C++. */
@DoNotStrip
public class CxxCallbackImpl @DoNotStrip private constructor() : HybridClassBase(), Callback {

  override fun invoke(vararg args: Any?) {
    nativeInvoke(Arguments.fromJavaArgs(args))
  }

  private external fun nativeInvoke(arguments: NativeArray)
}
