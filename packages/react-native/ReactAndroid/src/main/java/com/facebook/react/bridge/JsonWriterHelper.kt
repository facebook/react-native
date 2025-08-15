/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.util.JsonWriter
import java.io.IOException

/** Helper for generating JSON for lists and maps. */
public object JsonWriterHelper {
  @Throws(IOException::class)
  @JvmStatic
  public fun value(writer: JsonWriter, value: Any?) {
    when (value) {
      is Map<*, *> -> mapValue(writer, value)
      is List<*> -> listValue(writer, value)
      is ReadableMap -> readableMapValue(writer, value)
      is ReadableArray -> readableArrayValue(writer, value)
      is Dynamic -> dynamicValue(writer, value)
      else -> objectValue(writer, value)
    }
  }

  @Throws(IOException::class)
  private fun dynamicValue(writer: JsonWriter, value: Dynamic) {
    when (value.type) {
      ReadableType.Null -> writer.nullValue()
      ReadableType.Boolean -> writer.value(value.asBoolean())
      ReadableType.Number -> writer.value(value.asDouble())
      ReadableType.String -> writer.value(value.asString())
      ReadableType.Map -> {
        val map = value.asMap()
        readableMapValue(writer, checkNotNull(map))
      }
      ReadableType.Array -> {
        val array = value.asArray()
        readableArrayValue(writer, checkNotNull(array))
      }
    }
  }

  @Throws(IOException::class)
  private fun readableMapValue(writer: JsonWriter, value: ReadableMap) {
    writer.beginObject()
    try {
      val iterator = value.keySetIterator()
      while (iterator.hasNextKey()) {
        val key = iterator.nextKey()
        writer.name(key)
        when (value.getType(key)) {
          ReadableType.Null -> writer.nullValue()
          ReadableType.Boolean -> writer.value(value.getBoolean(key))
          ReadableType.Number -> writer.value(value.getDouble(key))
          ReadableType.String -> writer.value(value.getString(key))
          ReadableType.Map -> {
            val map = value.getMap(key)
            readableMapValue(writer, checkNotNull(map))
          }
          ReadableType.Array -> {
            val array = value.getArray(key)
            readableArrayValue(writer, checkNotNull(array))
          }
        }
      }
    } finally {
      writer.endObject()
    }
  }

  @Throws(IOException::class)
  @JvmStatic
  public fun readableArrayValue(writer: JsonWriter, value: ReadableArray) {
    writer.beginArray()
    try {
      for (i in 0 until value.size()) {
        when (value.getType(i)) {
          ReadableType.Null -> writer.nullValue()
          ReadableType.Boolean -> writer.value(value.getBoolean(i))
          ReadableType.Number -> writer.value(value.getDouble(i))
          ReadableType.String -> writer.value(value.getString(i))
          ReadableType.Map -> {
            val map = value.getMap(i)
            readableMapValue(writer, checkNotNull(map))
          }
          ReadableType.Array -> {
            val array = value.getArray(i)
            readableArrayValue(writer, checkNotNull(array))
          }
        }
      }
    } finally {
      writer.endArray()
    }
  }

  @Throws(IOException::class)
  private fun mapValue(writer: JsonWriter, map: Map<*, *>) {
    writer.beginObject()
    for ((key, value) in map) {
      writer.name(key.toString())
      this.value(writer, value)
    }
    writer.endObject()
  }

  @Throws(IOException::class)
  private fun listValue(writer: JsonWriter, list: List<*>) {
    writer.beginArray()
    for (item in list) {
      objectValue(writer, item)
    }
    writer.endArray()
  }

  @Throws(IOException::class)
  private fun objectValue(writer: JsonWriter, value: Any?) {
    when (value) {
      null -> writer.nullValue()
      is String -> writer.value(value)
      is Number -> writer.value(value)
      is Boolean -> writer.value(value)
      else -> throw IllegalArgumentException("Unknown value: $value")
    }
  }
}
