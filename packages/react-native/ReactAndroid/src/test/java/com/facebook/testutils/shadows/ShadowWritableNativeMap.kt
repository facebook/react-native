/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Implements(WritableNativeMap::class)
class ShadowWritableNativeMap : ShadowReadableNativeMap(), WritableMap {

  @Implementation override fun putNull(key: String): Unit = backingMap.putNull(key)

  @Implementation
  override fun putBoolean(key: String, value: Boolean): Unit = backingMap.putBoolean(key, value)

  @Implementation
  override fun putDouble(key: String, value: Double): Unit = backingMap.putDouble(key, value)

  @Implementation override fun putInt(key: String, value: Int): Unit = backingMap.putInt(key, value)

  @Implementation
  override fun putLong(key: String, value: Long): Unit = backingMap.putLong(key, value)

  @Implementation
  override fun putString(key: String, value: String?): Unit = backingMap.putString(key, value)

  @Implementation
  override fun putArray(key: String, value: ReadableArray?): Unit = backingMap.putArray(key, value)

  @Implementation
  override fun putMap(key: String, value: ReadableMap?): Unit = backingMap.putMap(key, value)

  @Implementation override fun merge(source: ReadableMap): Unit = backingMap.merge(source)

  @Implementation override fun copy(): WritableMap = backingMap.copy()
}
