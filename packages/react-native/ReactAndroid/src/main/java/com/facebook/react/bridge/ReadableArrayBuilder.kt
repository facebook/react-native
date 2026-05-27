/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * Convenience class for building a [ReadableArray] in a Kotlin idiomatic way. You can use it as
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
public inline fun buildReadableArray(builder: ReadableArrayBuilder.() -> Unit): ReadableArray {
  val array: WritableArray = Arguments.createArray()
  ReadableArrayBuilder(array).apply(builder)
  return array
}

public class ReadableArrayBuilder(private val array: WritableArray) {
  public fun add(value: String?) {
    array.pushString(value)
  }

  public fun add(value: Int) {
    array.pushInt(value)
  }

  public fun add(value: Boolean) {
    array.pushBoolean(value)
  }

  public fun add(value: Double) {
    array.pushDouble(value)
  }

  public fun add(value: Long) {
    array.pushDouble(value.toDouble())
  }

  public fun add(value: ReadableMap) {
    array.pushMap(value)
  }

  public fun add(value: ReadableArray) {
    array.pushArray(value)
  }

  public fun addNull() {
    array.pushNull()
  }

  public fun addMap(builder: ReadableMapBuilder.() -> Unit) {
    array.pushMap(buildReadableMap(builder))
  }

  public fun addArray(builder: ReadableArrayBuilder.() -> Unit) {
    array.pushArray(buildReadableArray(builder))
  }
}
