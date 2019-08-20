/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import android.os.Bundle;
import androidx.annotation.Nullable;
import java.lang.reflect.Array;
import java.util.AbstractList;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Arguments {
  private static Object makeNativeObject(Object object) {
    if (object == null) {
      return null;
    } else if (object instanceof Float
        || object instanceof Long
        || object instanceof Byte
        || object instanceof Short) {
      return ((Number) object).doubleValue();
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
   * This method converts a List into a NativeArray. The data types supported are boolean, int,
   * float, double, and String. List, Map, and Bundle objects, as well as arrays, containing values
   * of the above types and/or null, or any recursive arrangement of these, are also supported. The
   * best way to think of this is a way to generate a Java representation of a json list, from Java
   * types which have a natural representation in json.
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
   * This overload is like the above, but uses reflection to operate on any primitive or object
   * type.
   */
  public static <T> WritableNativeArray makeNativeArray(final Object objects) {
    if (objects == null) {
      return new WritableNativeArray();
    }
    // No explicit check for objects's type here.  If it's not an array, the
    // Array methods will throw IllegalArgumentException.
    return makeNativeArray(
        new AbstractList() {
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
   * This method converts a Map into a NativeMap. Value types are supported as with makeNativeArray.
   * The best way to think of this is a way to generate a Java representation of a json object, from
   * Java types which have a natural representation in json.
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

  /** Like the above, but takes a Bundle instead of a Map. */
  public static WritableNativeMap makeNativeMap(Bundle bundle) {
    WritableNativeMap nativeMap = new WritableNativeMap();
    if (bundle == null) {
      return nativeMap;
    }
    for (String key : bundle.keySet()) {
      addEntry(nativeMap, key, bundle.get(key));
    }
    return nativeMap;
  }

  /** This method should be used when you need to stub out creating NativeArrays in unit tests. */
  public static WritableArray createArray() {
    return new WritableNativeArray();
  }

  /** This method should be used when you need to stub out creating NativeMaps in unit tests. */
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
   *     {@code int[]}, {@code float[]}, {@code double[]}, {@code boolean[]}.
   * @return the converted {@link WritableArray}
   * @throws IllegalArgumentException if the passed object is none of the above types
   */
  public static WritableArray fromArray(Object array) {
    WritableArray catalystArray = createArray();
    if (array instanceof String[]) {
      for (String v : (String[]) array) {
        catalystArray.pushString(v);
      }
    } else if (array instanceof Bundle[]) {
      for (Bundle v : (Bundle[]) array) {
        catalystArray.pushMap(fromBundle(v));
      }
    } else if (array instanceof int[]) {
      for (int v : (int[]) array) {
        catalystArray.pushInt(v);
      }
    } else if (array instanceof float[]) {
      for (float v : (float[]) array) {
        catalystArray.pushDouble(v);
      }
    } else if (array instanceof double[]) {
      for (double v : (double[]) array) {
        catalystArray.pushDouble(v);
      }
    } else if (array instanceof boolean[]) {
      for (boolean v : (boolean[]) array) {
        catalystArray.pushBoolean(v);
      }
    } else {
      throw new IllegalArgumentException("Unknown array type " + array.getClass());
    }
    return catalystArray;
  }

  /**
   * Convert a {@link List} to a {@link WritableArray}.
   *
   * @param list the list to convert. Supported value types are: {@code null}, {@code String},
   *     {@code Bundle}, {@code List}, {@code Number}, {@code Boolean}, and all array types
   *     supported in {@link #fromArray(Object)}.
   * @return the converted {@link WritableArray}
   * @throws IllegalArgumentException if one of the values from the passed list is none of the above
   *     types
   */
  public static WritableArray fromList(List list) {
    WritableArray catalystArray = createArray();
    for (Object obj : list) {
      if (obj == null) {
        catalystArray.pushNull();
      } else if (obj.getClass().isArray()) {
        catalystArray.pushArray(fromArray(obj));
      } else if (obj instanceof Bundle) {
        catalystArray.pushMap(fromBundle((Bundle) obj));
      } else if (obj instanceof List) {
        catalystArray.pushArray(fromList((List) obj));
      } else if (obj instanceof String) {
        catalystArray.pushString((String) obj);
      } else if (obj instanceof Integer) {
        catalystArray.pushInt((Integer) obj);
      } else if (obj instanceof Number) {
        catalystArray.pushDouble(((Number) obj).doubleValue());
      } else if (obj instanceof Boolean) {
        catalystArray.pushBoolean((Boolean) obj);
      } else {
        throw new IllegalArgumentException("Unknown value type " + obj.getClass());
      }
    }
    return catalystArray;
  }

  /**
   * Convert a {@link Bundle} to a {@link WritableMap}. Supported key types in the bundle are:
   *
   * <p>
   *
   * <ul>
   *   <li>primitive types: int, float, double, boolean
   *   <li>arrays supported by {@link #fromArray(Object)}
   *   <li>lists supported by {@link #fromList(List)}
   *   <li>{@link Bundle} objects that are recursively converted to maps
   * </ul>
   *
   * @param bundle the {@link Bundle} to convert
   * @return the converted {@link WritableMap}
   * @throws IllegalArgumentException if there are keys of unsupported types
   */
  public static WritableMap fromBundle(Bundle bundle) {
    WritableMap map = createMap();
    for (String key : bundle.keySet()) {
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
      } else if (value instanceof List) {
        map.putArray(key, fromList((List) value));
      } else {
        throw new IllegalArgumentException("Could not convert " + value.getClass());
      }
    }
    return map;
  }

  /**
   * Convert a {@link WritableArray} to a {@link ArrayList}.
   *
   * @param readableArray the {@link WritableArray} to convert.
   * @return the converted {@link ArrayList}.
   */
  @Nullable
  public static ArrayList toList(@Nullable ReadableArray readableArray) {
    if (readableArray == null) {
      return null;
    }

    ArrayList list = new ArrayList();

    for (int i = 0; i < readableArray.size(); i++) {
      switch (readableArray.getType(i)) {
        case Null:
          list.add(null);
          break;
        case Boolean:
          list.add(readableArray.getBoolean(i));
          break;
        case Number:
          double number = readableArray.getDouble(i);
          if (number == Math.rint(number)) {
            // Add as an integer
            list.add((int) number);
          } else {
            // Add as a double
            list.add(number);
          }
          break;
        case String:
          list.add(readableArray.getString(i));
          break;
        case Map:
          list.add(toBundle(readableArray.getMap(i)));
          break;
        case Array:
          list.add(toList(readableArray.getArray(i)));
          break;
        default:
          throw new IllegalArgumentException("Could not convert object in array.");
      }
    }

    return list;
  }

  /**
   * Convert a {@link WritableMap} to a {@link Bundle}. Note: Each array is converted to an {@link
   * ArrayList}.
   *
   * @param readableMap the {@link WritableMap} to convert.
   * @return the converted {@link Bundle}.
   */
  @Nullable
  public static Bundle toBundle(@Nullable ReadableMap readableMap) {
    if (readableMap == null) {
      return null;
    }

    ReadableMapKeySetIterator iterator = readableMap.keySetIterator();

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
          bundle.putSerializable(key, toList(readableMap.getArray(key)));
          break;
        default:
          throw new IllegalArgumentException("Could not convert object with key: " + key + ".");
      }
    }

    return bundle;
  }
}
