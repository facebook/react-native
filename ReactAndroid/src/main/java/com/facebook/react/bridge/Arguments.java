/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import javax.annotation.Nullable;

import android.os.Bundle;

public class Arguments {

  /**
   * This method should be used when you need to stub out creating NativeArrays in unit tests.
   */
  public static WritableArray createArray() {
    return new WritableNativeArray();
  }

  /**
   * This method should be used when you need to stub out creating NativeMaps in unit tests.
   */
  public static WritableMap createMap() {
    return new WritableNativeMap();
  }

  public static WritableNativeArray fromJavaArgs(Object[] args) {
    WritableNativeArray arguments = new WritableNativeArray();
    for (int i = 0; i < args.length; i++) {
      Object argument = args[i];
      if (argument == null) {
        arguments.pushNull();
        continue;
      }

      Class argumentClass = argument.getClass();
      if (argumentClass == Boolean.class) {
        arguments.pushBoolean(((Boolean) argument).booleanValue());
      } else if (argumentClass == Integer.class) {
        arguments.pushDouble(((Integer) argument).doubleValue());
      } else if (argumentClass == Double.class) {
        arguments.pushDouble(((Double) argument).doubleValue());
      } else if (argumentClass == Float.class) {
        arguments.pushDouble(((Float) argument).doubleValue());
      } else if (argumentClass == String.class) {
        arguments.pushString(argument.toString());
      } else if (argumentClass == WritableNativeMap.class) {
        arguments.pushMap((WritableNativeMap) argument);
      } else if (argumentClass == WritableNativeArray.class) {
        arguments.pushArray((WritableNativeArray) argument);
      } else {
        throw new RuntimeException("Cannot convert argument of type " + argumentClass);
      }
    }
    return arguments;
  }

  /**
   * Convert an array to a {@link WritableArray}.
   *
   * @param array the array to convert. Supported types are: {@code String[]}, {@code Bundle[]},
   * {@code int[]}, {@code float[]}, {@code double[]}, {@code boolean[]}.
   *
   * @return the converted {@link WritableArray}
   * @throws IllegalArgumentException if the passed object is none of the above types
   */
  public static WritableArray fromArray(Object array) {
    WritableArray catalystArray = createArray();
    if (array instanceof String[]) {
      for (String v: (String[]) array) {
        catalystArray.pushString(v);
      }
    } else if (array instanceof Bundle[]) {
      for (Bundle v: (Bundle[]) array) {
        catalystArray.pushMap(fromBundle(v));
      }
    } else if (array instanceof int[]) {
      for (int v: (int[]) array) {
        catalystArray.pushInt(v);
      }
    } else if (array instanceof float[]) {
      for (float v: (float[]) array) {
        catalystArray.pushDouble(v);
      }
    } else if (array instanceof double[]) {
      for (double v: (double[]) array) {
        catalystArray.pushDouble(v);
      }
    } else if (array instanceof boolean[]) {
      for (boolean v: (boolean[]) array) {
        catalystArray.pushBoolean(v);
      }
    } else {
      throw new IllegalArgumentException("Unknown array type " + array.getClass());
    }
    return catalystArray;
  }

  /**
   * Convert a {@link Bundle} to a {@link WritableMap}. Supported key types in the bundle
   * are:
   *
   * <ul>
   *   <li>primitive types: int, float, double, boolean</li>
   *   <li>arrays supported by {@link #fromArray(Object)}</li>
   *   <li>{@link Bundle} objects that are recursively converted to maps</li>
   * </ul>
   *
   * @param bundle the {@link Bundle} to convert
   * @return the converted {@link WritableMap}
   * @throws IllegalArgumentException if there are keys of unsupported types
   */
  public static WritableMap fromBundle(Bundle bundle) {
    WritableMap map = createMap();
    for (String key: bundle.keySet()) {
      Object value = bundle.get(key);
      if (value == null) {
        map.putNull(key);
      } else if (value.getClass().isArray()) {
        map.putArray(key, fromArray(value));
      } else if (value instanceof String) {
        map.putString(key, (String) value);
      } else if (value instanceof Number) {
        if (value instanceof Integer) {
          map.putInt(key, (Integer) value);
        } else {
          map.putDouble(key, ((Number) value).doubleValue());
        }
      } else if (value instanceof Boolean) {
        map.putBoolean(key, (Boolean) value);
      } else if (value instanceof Bundle) {
        map.putMap(key, fromBundle((Bundle) value));
      } else {
        throw new IllegalArgumentException("Could not convert " + value.getClass());
      }
    }
    return map;
  }

  /**
   * Convert a {@link WritableMap} to a {@link Bundle}.
   * @param readableMap the {@link WritableMap} to convert.
   * @return the converted {@link Bundle}.
   */
  @Nullable
  public static Bundle toBundle(@Nullable ReadableMap readableMap) {
    if (readableMap == null) {
      return null;
    }

    ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
    if (!iterator.hasNextKey()) {
      return null;
    }

    Bundle bundle = new Bundle();
    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      ReadableType readableType = readableMap.getType(key);
      switch (readableType) {
        case Null:
          bundle.putString(key, null);
          break;
        case Boolean:
          bundle.putBoolean(key, readableMap.getBoolean(key));
          break;
        case Number:
          // Can be int or double.
          bundle.putDouble(key, readableMap.getDouble(key));
          break;
        case String:
          bundle.putString(key, readableMap.getString(key));
          break;
        case Map:
          bundle.putBundle(key, toBundle(readableMap.getMap(key)));
          break;
        case Array:
          // TODO t8873322
          throw new UnsupportedOperationException("Arrays aren't supported yet.");
        default:
          throw new IllegalArgumentException("Could not convert object with key: " + key + ".");
      }
    }

    return bundle;
  }
}
