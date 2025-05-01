package com.facebook.react.bridge.collections

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray

public inline fun buildReadableArray(builder: ReadableArrayBuilder.() -> Unit): ReadableArray {
  val array: WritableArray = Arguments.createArray()
  ReadableArrayBuilder(array).apply(builder)
  return array
}

public class ReadableArrayBuilder(
  private val array: WritableArray
) {
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
