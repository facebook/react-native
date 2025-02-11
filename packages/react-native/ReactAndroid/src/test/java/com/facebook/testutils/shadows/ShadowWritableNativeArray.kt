/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableNativeArray
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Implements(WritableNativeArray::class)
class ShadowWritableNativeArray : ShadowReadableNativeArray(), WritableArray {

  @Implementation override fun pushNull(): Unit = backingArray.pushNull()

  @Implementation override fun pushBoolean(value: Boolean): Unit = backingArray.pushBoolean(value)

  @Implementation override fun pushDouble(value: Double): Unit = backingArray.pushDouble(value)

  @Implementation override fun pushInt(value: Int): Unit = backingArray.pushInt(value)

  @Implementation override fun pushLong(value: Long): Unit = backingArray.pushLong(value)

  @Implementation override fun pushString(value: String?): Unit = backingArray.pushString(value)

  @Implementation
  override fun pushArray(array: ReadableArray?): Unit = backingArray.pushArray(array)

  @Implementation override fun pushMap(map: ReadableMap?): Unit = backingArray.pushMap(map)
}
