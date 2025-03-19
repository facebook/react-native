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
import com.facebook.react.bridge.ReadableNativeArray
import com.facebook.react.bridge.ReadableType
import java.util.ArrayList
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Implements(ReadableNativeArray::class)
open class ShadowReadableNativeArray : ShadowNativeArray(), ReadableArray {

  @Implementation override fun size(): Int = backingArray.size()

  @Implementation override fun isNull(index: Int): Boolean = backingArray.isNull(index)

  @Implementation override fun getBoolean(index: Int): Boolean = backingArray.getBoolean(index)

  @Implementation override fun getDouble(index: Int): Double = backingArray.getDouble(index)

  @Implementation override fun getInt(index: Int): Int = backingArray.getInt(index)

  @Implementation override fun getLong(index: Int): Long = backingArray.getLong(index)

  @Implementation override fun getString(index: Int): String? = backingArray.getString(index)

  @Implementation override fun getArray(index: Int): ReadableArray? = backingArray.getArray(index)

  @Implementation override fun getMap(index: Int): ReadableMap? = backingArray.getMap(index)

  @Implementation override fun getDynamic(index: Int): Dynamic = backingArray.getDynamic(index)

  @Implementation override fun getType(index: Int): ReadableType = backingArray.getType(index)

  @Implementation override fun toArrayList(): ArrayList<Any?> = backingArray.toArrayList()
}
