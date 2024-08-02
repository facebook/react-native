/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.infer.annotation.Assertions
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny

/**
 * Implementation of a write-only array stored in native memory. Use [Arguments.createArray] if you
 * need to stub out creating this class in a test. TODO(5815532): Check if consumed on read
 */
@DoNotStripAny
public open class WritableNativeArray : ReadableNativeArray(initHybrid()), WritableArray {
  external override fun pushNull()

  external override fun pushBoolean(value: Boolean)

  external override fun pushDouble(value: Double)

  external override fun pushInt(value: Int)

  external override fun pushLong(value: Long)

  external override fun pushString(value: String?)

  // Note: this consumes the array so do not reuse it.
  override fun pushArray(array: ReadableArray?) {
    Assertions.assertCondition(
        array == null || array is ReadableNativeArray, "Illegal type provided")
    pushNativeArray(array as ReadableNativeArray?)
  }

  // Note: this consumes the map so do not reuse it.
  override fun pushMap(map: ReadableMap?) {
    Assertions.assertCondition(map == null || map is ReadableNativeMap, "Illegal type provided")
    pushNativeMap(map as ReadableNativeMap?)
  }

  private external fun pushNativeArray(array: ReadableNativeArray?)

  private external fun pushNativeMap(map: ReadableNativeMap?)

  private companion object {
    init {
      ReactBridge.staticInit()
    }

    @JvmStatic private external fun initHybrid(): HybridData?
  }
}
