/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import java.lang.reflect.Array;

import java.util.AbstractList;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

import android.os.Bundle;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

public class Arguments {
  private static Object makeNativeObject(Object object) {
    if (object == null) {
      return null;
    } else if (object instanceof Float ||
               object instanceof Long ||
               object instanceof Byte ||
               object instanceof Short) {
      return new Double(((Number) object).doubleValue());
    } else if (object.getClass().isArray()) {
      return makeNativeArray(object);
    } else if (object instanceof List) {
      return makeNativeArray((List) object);
    } else if (object instanceof Map) {
      return makeNativeMap((Map<String, Object>) object);
    } else if (object instanceof Bundle) {
      return makeNativeMap((Bundle) object);
    } else {
      // Boolean, Integer, Double, String, WritableNativeArray, WritableNativeMap
      return object;
    }
  }

  /**
   * This method converts a List into a NativeArray.  The data types supported
   * are boolean, int, float, double, and String.  List, Map, and Bundle
   * objects, as well as arrays, containing values of the above types and/or
   * null, or any recursive arrangement of these, are also supported.  The best
   * way to think of this is a way to generate a Java representation of a json
   * list, from Java types which have a natural representation in json.
   */
  public static WritableNativeArray makeNativeArray(List objects) {
    WritableNativeArray nativeArray = new WritableNativeArray();
    if (objects == null) {
      return nativeArray;
    }
    for (Object elem : objects) {
      elem = makeNativeObject(elem);
      if (elem == null) {
        nativeArray.pushNull();
      } else if (elem instanceof Boolean) {
        nativeArray.pushBoolean((Boolean) elem);
      } else if (elem instanceof Integer) {
        nativeArray.pushInt((Integer) elem);
      } else if (elem instanceof Double) {
        nativeArray.pushDouble((Double) elem);
      } else if (elem instanceof String) {
        nativeArray.pushString((String) elem);
      } else if (elem instanceof WritableNativeArray) {
        nativeArray.pushArray((WritableNativeArray) elem);
      } else if (elem instanceof WritableNativeMap) {
        nativeArray.pushMap((WritableNativeMap) elem);
      } else {
        throw new IllegalArgumentException("Could not convert " + elem.getClass());
      }
    }
    return nativeArray;
  }


  /**
   * This overload is like the above, but uses reflection to operate on any
   * primitive or object type.
   */
  public static <T> WritableNativeArray makeNativeArray(final Object objects) {
    if (objects == null) {
      return new WritableNativeArray();
    }
    // No explicit check for objects's type here.  If it's not an array, the
    // Array methods will throw IllegalArgumentException.
    return makeNativeArray(new AbstractList() {
        public int size() {
          return Array.getLength(objects);
        }
        public Object get(int index) {
          return Array.get(objects, index);
        }
      });
  }

  private static void addEntry(WritableNativeMap nativeMap, String key, Object value) {
    value = makeNativeObject(value);
    if (value == null) {
      nativeMap.putNull(key);
    } else if (value instanceof Boolean) {
      nativeMap.putBoolean(key, (Boolean) value);
    } else if (value instanceof Integer) {
      nativeMap.putInt(key, (Integer) value);
    } else if (value instanceof Number) {
      nativeMap.putDouble(key, ((Number) value).doubleValue());
    } else if (value instanceof String) {
      nativeMap.putString(key, (String) value);
    } else if (value instanceof WritableNativeArray) {
      nativeMap.putArray(key, (WritableNativeArray) value);
    } else if (value instanceof WritableNativeMap) {
      nativeMap.putMap(key, (WritableNativeMap) value);
    } else {
      throw new IllegalArgumentException("Could not convert " + value.getClass());
    }
  }

  /**
   * This method converts a Map into a NativeMap.  Value types are supported as
   * with makeNativeArray.  The best way to think of this is a way to generate
   * a Java representation of a json object, from Java types which have a
   * natural representation in json.
   */
  public static WritableNativeMap makeNativeMap(Map<String, Object> objects) {
    WritableNativeMap nativeMap = new WritableNativeMap();
    if (objects == null) {
      return nativeMap;
    }
    for (Map.Entry<String, Object> entry : objects.entrySet()) {
      addEntry(nativeMap, entry.getKey(), entry.getValue());
    }
    return nativeMap;
  }

  /**
   * Like the above, but takes a Bundle instead of a Map.
   */
  public static WritableNativeMap makeNativeMap(Bundle bundle) {
    WritableNativeMap nativeMap = new WritableNativeMap();
    if (bundle == null) {
      return nativeMap;
    }
    for (String key: bundle.keySet()) {
      addEntry(nativeMap, key, bundle.get(key));
    }
    return nativeMap;
  }
}
