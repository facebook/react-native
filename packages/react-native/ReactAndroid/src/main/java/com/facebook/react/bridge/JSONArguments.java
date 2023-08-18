/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import java.util.Iterator;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class JSONArguments {
  /**
   * Parse JSONObject to ReadableMap
   *
   * @param obj The JSONObject to be parsed
   * @return readableMap from the JSONObject
   */
  public static ReadableMap fromJSONObject(JSONObject obj) throws JSONException {
    WritableMap result = Arguments.createMap();
    Iterator<String> keys = obj.keys();

    while (keys.hasNext()) {
      String key = keys.next();
      Object val = obj.get(key);
      if (val instanceof JSONObject) {
        result.putMap(key, fromJSONObject((JSONObject) val));
      } else if (val instanceof JSONArray) {
        result.putArray(key, fromJSONArray((JSONArray) val));
      } else if (val instanceof String) {
        result.putString(key, (String) val);
      } else if (val instanceof Boolean) {
        result.putBoolean(key, (Boolean) val);
      } else if (val instanceof Integer) {
        result.putInt(key, (Integer) val);
      } else if (val instanceof Double) {
        result.putDouble(key, (Double) val);
      } else if (val instanceof Long) {
        result.putInt(key, ((Long) val).intValue());
      } else if (obj.isNull(key)) {
        result.putNull(key);
      } else {
        // Unknown value type. Will throw
        throw new JSONException("Unexpected value when parsing JSON object. key: " + key);
      }
    }

    return result;
  }

  /**
   * Parse String of JSON object to ReadableMap
   *
   * @param objStr The String JSON object to be parsed
   * @return readableMap from the JSONArray
   */
  public static ReadableMap fromJSONObjectString(String objStr) throws JSONException {
    return fromJSONObject(new JSONObject(objStr));
  }

  /**
   * Parse JSONArray to ReadableArray
   *
   * @param arr The JSONArray to be parsed
   * @return readableArray from the JSONArray
   */
  public static ReadableArray fromJSONArray(JSONArray arr) throws JSONException {
    WritableArray result = Arguments.createArray();

    for (int i = 0; i < arr.length(); i++) {
      Object val = arr.get(i);

      if (val instanceof JSONObject) {
        result.pushMap(fromJSONObject((JSONObject) val));
      } else if (val instanceof JSONArray) {
        result.pushArray(fromJSONArray((JSONArray) val));
      } else if (val instanceof String) {
        result.pushString((String) val);
      } else if (val instanceof Boolean) {
        result.pushBoolean((Boolean) val);
      } else if (val instanceof Integer) {
        result.pushInt((Integer) val);
      } else if (val instanceof Double) {
        result.pushDouble((Double) val);
      } else if (val instanceof Long) {
        result.pushInt(((Long) val).intValue());
      } else if (arr.isNull(i)) {
        result.pushNull();
      } else {
        // Unknown value type. Will throw
        throw new JSONException("Unexpected value when parsing JSON array. index: " + i);
      }
    }

    return result;
  }

  /**
   * Parse String of JSON array to ReadableArray
   *
   * @param arrStr The String JSON array to be parsed
   * @return readableArray from the JSONArray
   */
  public static ReadableArray fromJSONArrayString(String arrStr) throws JSONException {
    return fromJSONArray(new JSONArray(arrStr));
  }
}
