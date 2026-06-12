/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip

/** C++-backed promise reject callback (error maps only; folly::dynamic path). */
@DoNotStrip
internal class CxxCallbackRejectImpl @DoNotStrip private constructor() :
    HybridClassBase(), Callback {

  override fun invoke(vararg args: Any?) {
    @Suppress("UNCHECKED_CAST")
    nativeInvoke(Arguments.fromJavaArgs(args as Array<Any?>))
  }

  private external fun nativeInvoke(arguments: NativeArray)
}
