/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableMapKeySetIterator
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.ReadableType
import java.util.HashMap
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Implements(ReadableNativeMap::class)
open class ShadowReadableNativeMap : ShadowNativeMap(), ReadableMap {

  @Implementation override fun hasKey(name: String): Boolean = backingMap.hasKey(name)

  @Implementation override fun isNull(name: String): Boolean = backingMap.isNull(name)

  @Implementation override fun getBoolean(name: String): Boolean = backingMap.getBoolean(name)

  @Implementation override fun getDouble(name: String): Double = backingMap.getDouble(name)

  @Implementation override fun getInt(name: String): Int = backingMap.getInt(name)

  @Implementation override fun getLong(name: String): Long = backingMap.getLong(name)

  @Implementation override fun getString(name: String): String? = backingMap.getString(name)

  @Implementation override fun getArray(name: String): ReadableArray? = backingMap.getArray(name)

  @Implementation override fun getMap(name: String): ReadableMap? = backingMap.getMap(name)

  @Implementation override fun getDynamic(name: String): Dynamic = backingMap.getDynamic(name)

  @Implementation override fun getType(name: String): ReadableType = backingMap.getType(name)

  @get:Implementation
  override val entryIterator: Iterator<Map.Entry<String, Any?>>
    get() = backingMap.entryIterator

  @Implementation
  override fun keySetIterator(): ReadableMapKeySetIterator = backingMap.keySetIterator()

  @Implementation override fun toHashMap(): HashMap<String, Any?> = backingMap.toHashMap()
}
