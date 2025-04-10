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

@LegacyArchitecture
public object JSONArguments {

  init {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "JSONArguments", LegacyArchitectureLogLevel.WARNING)
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
    val result: WritableMap = Arguments.createMap()
    val keys = obj.keys()

    while (keys.hasNext()) {
      val key = keys.next()
      val value = obj.get(key)

      when (value) {
        is JSONObject -> result.putMap(key, fromJSONObject(value))
        is JSONArray -> result.putArray(key, fromJSONArray(value))
        is String -> result.putString(key, value)
        is Boolean -> result.putBoolean(key, value)
        is Int -> result.putInt(key, value)
        is Double -> result.putDouble(key, value)
        is Long -> result.putInt(key, value.toInt())
        else ->
            if (obj.isNull(key)) {
              result.putNull(key)
            } else {
              throw JSONException("Unexpected value when parsing JSON object. key: $key")
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
    val result: WritableArray = Arguments.createArray()

    for (i in 0 until arr.length()) {
      val value = arr.get(i)

      when (value) {
        is JSONObject -> result.pushMap(fromJSONObject(value))
        is JSONArray -> result.pushArray(fromJSONArray(value))
        is String -> result.pushString(value)
        is Boolean -> result.pushBoolean(value)
        is Int -> result.pushInt(value)
        is Double -> result.pushDouble(value)
        is Long -> result.pushInt(value.toInt())
        else ->
            if (arr.isNull(i)) {
              result.pushNull()
            } else {
              throw JSONException("Unexpected value when parsing JSON array. index: $i")
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
