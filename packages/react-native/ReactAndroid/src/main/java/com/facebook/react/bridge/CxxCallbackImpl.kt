/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip
import java.nio.ByteBuffer

/**
 * Callback impl that calls directly into the cxx bridge. Created from C++.
 * A single direct [ByteBuffer] bypasses folly::dynamic for zero-copy `jsi::ArrayBuffer`
 * on the JS thread (see [JCxxCallbackImpl]).
 */
@DoNotStrip
public class CxxCallbackImpl @DoNotStrip private constructor() : HybridClassBase(), Callback {

  override fun invoke(vararg args: Any?) {
    val singleArg = args.singleOrNull()
    if (singleArg is ByteBuffer) {
      requireDirectByteBuffer(singleArg)
      nativeInvokeWithByteBuffer(singleArg)
      return
    }

    val hasByteBuffer = args.any { arg ->
      if (arg is ByteBuffer) {
        requireDirectByteBuffer(arg)
        true
      } else {
        false
      }
    }

    if (hasByteBuffer) {
      throw IllegalArgumentException(
        "Callbacks support at most one direct ByteBuffer argument passed alone. " +
          "Use promise.resolve(buffer) or callback.invoke(buffer)."
      )
    }

    @Suppress("UNCHECKED_CAST") nativeInvoke(Arguments.fromJavaArgs(args as Array<Any?>))
  }

  private external fun nativeInvoke(arguments: NativeArray)

  private external fun nativeInvokeWithByteBuffer(buffer: ByteBuffer)

  private companion object {
    private fun requireDirectByteBuffer(buffer: ByteBuffer) {
      check(buffer.isDirect) {
        "Only direct ByteBuffers (ByteBuffer.allocateDirect) can be passed to a native " +
          "callback or promise. Use ByteBuffer.allocateDirect() instead of ByteBuffer.wrap() " +
          "or ByteBuffer.allocate()."
      }
    }
  }
}
