/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * <p>
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.content;

import android.content.SharedPreferences;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableArray;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class SettingsUtil {
  public static final String TAG = SettingsUtil.class.getCanonicalName();

  /**
   * Convert {@link ReadableArray} To {@link Set} that contains {@link String} values
   *
   * @param array {@link ReadableArray} with  {@link String} values
   * @return
   */
  public static Set<String> convertReadableArrToStrSet(ReadableArray array) {
    Set<String> stringSet = new HashSet<>();
    for (int i = 0; i < array.size(); i++) {
      switch (array.getType(i)) {
        case Null:
          break;
        case String:
          stringSet.add(array.getString(i));
          break;
        case Array:
          convertReadableArrToStrSet(array.getArray(i));
          break;
      }
    }
    return stringSet;
  }

  /**
   * Resolves a value from {@link SharedPreferences} for a given key
   *
   * @param preferences {@link SharedPreferences}
   * @param key name of key to resolve to
   * @return
   */
  public static Object getValue(SharedPreferences preferences, String key) {
    Map<String, ?> entries = preferences.getAll();
    if (!entries.containsKey(key)) {
      throw new IllegalArgumentException();
    }
    for (Map.Entry<String, ?> entry : entries.entrySet()) {
      if (entry.getKey().equals(key)) {
        if (entry.getValue().getClass() == String.class) {
          return preferences.getString(key, "");
        } else if (entry.getValue().getClass() == Integer.class) {
          return preferences.getInt(key, 1);
        } else if (entry.getValue().getClass() == Boolean.class) {
          return preferences.getBoolean(key, true);
        } else if (entry.getValue().getClass() == Float.class) {
          //Float -> Number in React Native Module, Arguments.java cast number to double,
          // avoiding loss of information
          return String.valueOf(preferences.getFloat(key, 1.0f));
        } else if (entry.getValue().getClass() == HashSet.class) {
          return convertStrSetToReadableArr(preferences.getStringSet(key, new HashSet<String>()));
        } else if (entry.getValue().getClass() == Long.class) {
          return (double) preferences.getLong(key, 1L);
        }
      }
    }
    return null;
  }

  /**
   * Set <K,V> pairs specified via {@link ReadableMap} in the {@link SharedPreferences}
   *
   * @param preferences {@link SharedPreferences}
   * @param map {@link ReadableMap} of <K,V> , V is {@link com.facebook.react.bridge.ReadableType}
   */
  public static void setValues(SharedPreferences preferences, ReadableMap map) {
    SharedPreferences.Editor editor = preferences.edit();
    ReadableMapKeySetIterator iterator = map.keySetIterator();
    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      switch (map.getType(key)) {
        case Boolean:
          editor.putBoolean(key, map.getBoolean(key)).apply();
          break;
        case String:
          editor.putString(key, map.getString(key)).apply();
          break;
        case Number:
          double tmp = map.getDouble(key);
          if (tmp == (int) tmp) {
            editor.putInt(key, (int) tmp).apply();
          } else {
            //Narrow Scope
            editor.putFloat(key, (float) tmp).apply();
          }
          break;
        case Array:
          editor.putStringSet(
            key,
            SettingsUtil.convertReadableArrToStrSet(map.getArray(key))).apply();
          break;
        default:
          FLog.e(TAG, "Couldn't resolve value for key : " + key);
      }
    }
    editor.commit();
  }

  /**
   * Convert {@link Set} of {@link String} to {@link ReadableArray}
   *
   * @param stringSet
   * @return
   */

  public static ReadableArray convertStrSetToReadableArr(Set<String> stringSet) {
    WritableArray array = Arguments.createArray();
    for (String s : stringSet) {
      array.pushString(s);
    }
    return array;
  }

  /**
   * Convert ReadableArray to List
   *
   * @param array pass string parameters from JS to Java.
   * @return List of String
   */
  public static final List<String> convertReadableArrToList(ReadableArray array) {
    List<String> list = new ArrayList<>();
    for (int i = 0; i < array.size(); i++) {
      list.add(array.getString(i));
    }
    return list;
  }
}
