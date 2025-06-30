/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
public object JSONArguments {

  init {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "JSONArguments", LegacyArchitectureLogLevel.ERROR)
  }

  /**
   * Parse JSONObject to ReadableMap
   *
   * @param obj The JSONObject to be parsed
   * @return readableMap from the JSONObject
   */
  @JvmStatic
  @Throws(JSONException::class)
  public fun fromJSONObject(obj: JSONObject): ReadableMap {
    val keys = obj.keys()

    val result = buildReadableMap {
      while (keys.hasNext()) {
        val key = keys.next()
        when (val value = obj.get(key)) {
          is JSONObject -> put(key, fromJSONObject(value))
          is JSONArray -> put(key, fromJSONArray(value))
          is String -> put(key, value)
          is Boolean -> put(key, value)
          is Int -> put(key, value)
          is Double -> put(key, value)
          is Long -> put(key, value.toInt())
          else ->
              if (obj.isNull(key)) {
                putNull(key)
              } else {
                throw JSONException("Unexpected value when parsing JSON object. key: $key")
              }
        }
      }
    }

    return result
  }

  /**
   * Parse String of JSON object to ReadableMap
   *
   * @param objStr The String JSON object to be parsed
   * @return readableMap from the JSONArray
   */
  @JvmStatic
  @Throws(JSONException::class)
  public fun fromJSONObjectString(objStr: String): ReadableMap {
    return fromJSONObject(JSONObject(objStr))
  }

  /**
   * Parse JSONArray to ReadableArray
   *
   * @param arr The JSONArray to be parsed
   * @return readableArray from the JSONArray
   */
  @JvmStatic
  @Throws(JSONException::class)
  public fun fromJSONArray(arr: JSONArray): ReadableArray {
    val result = buildReadableArray {
      repeat(arr.length()) {
        when (val value = arr.get(it)) {
          is JSONObject -> add(fromJSONObject(value))
          is JSONArray -> add(fromJSONArray(value))
          is String -> add(value)
          is Boolean -> add(value)
          is Int -> add(value)
          is Double -> add(value)
          is Long -> add(value.toInt())
          else ->
              if (arr.isNull(it)) {
                addNull()
              } else {
                throw JSONException("Unexpected value when parsing JSON array. index: $it")
              }
        }
      }
    }

    return result
  }

  /**
   * Parse String of JSON array to ReadableArray
   *
   * @param arrStr The String JSON array to be parsed
   * @return readableArray from the JSONArray
   */
  @JvmStatic
  @Throws(JSONException::class)
  public fun fromJSONArrayString(arrStr: String): ReadableArray {
    return fromJSONArray(JSONArray(arrStr))
  }
}
