/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * Convenience class for building a [ReadableMap] in a Kotlin idiomatic way. You can use it as
 * follows:
 * ```
 * val array: ReadableArray = buildReadableArray {
 *       add("one")
 *       add(2)
 *       add(true)
 *       addNull()
 *       addMap { put("nestedKey", "nestedValue") }
 *     }
 * ```
 */
public inline fun buildReadableMap(builder: ReadableMapBuilder.() -> Unit): ReadableMap {
  val map: WritableMap = Arguments.createMap()
  ReadableMapBuilder(map).apply(builder)
  return map
}

public class ReadableMapBuilder(private val map: WritableMap) {
  public fun put(key: String, value: String?) {
    map.putString(key, value)
  }

  public fun put(key: String, value: Int) {
    map.putInt(key, value)
  }

  public fun put(key: String, value: Boolean) {
    map.putBoolean(key, value)
  }

  public fun put(key: String, value: Double) {
    map.putDouble(key, value)
  }

  public fun put(key: String, value: Long) {
    map.putDouble(key, value.toDouble())
  }

  public fun putNull(key: String) {
    map.putNull(key)
  }

  public fun putMap(key: String, builder: ReadableMapBuilder.() -> Unit) {
    map.putMap(key, buildReadableMap(builder))
  }

  public fun putArray(key: String, builder: ReadableArrayBuilder.() -> Unit) {
    map.putArray(key, buildReadableArray(builder))
  }
}
