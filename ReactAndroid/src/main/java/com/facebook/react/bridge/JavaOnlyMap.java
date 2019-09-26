/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

/**
 * Java {@link HashMap} backed implementation of {@link ReadableMap} and {@link WritableMap}
 * Instances of this class SHOULD NOT be used for communication between java and JS, use instances
 * of {@link WritableNativeMap} created via {@link Arguments#createMap} or just {@link ReadableMap}
 * interface if you want your "native" module method to take a map from JS as an argument.
 *
 * <p>Main purpose for this class is to be used in java-only unit tests, but could also be used
 * outside of tests in the code that operates only in java and needs to communicate with RN modules
 * via their JS-exposed API.
 */
public class JavaOnlyMap implements ReadableMap, WritableMap {

  private final Map mBackingMap;

  public static JavaOnlyMap of(Object... keysAndValues) {
    return new JavaOnlyMap(keysAndValues);
  }

  public static JavaOnlyMap deepClone(ReadableMap map) {
    JavaOnlyMap res = new JavaOnlyMap();
    ReadableMapKeySetIterator iter = map.keySetIterator();
    while (iter.hasNextKey()) {
      String propKey = iter.nextKey();
      ReadableType type = map.getType(propKey);
      switch (type) {
        case Null:
          res.putNull(propKey);
          break;
        case Boolean:
          res.putBoolean(propKey, map.getBoolean(propKey));
          break;
        case Number:
          res.putDouble(propKey, map.getDouble(propKey));
          break;
        case String:
          res.putString(propKey, map.getString(propKey));
          break;
        case Map:
          res.putMap(propKey, deepClone(map.getMap(propKey)));
          break;
        case Array:
          res.putArray(propKey, JavaOnlyArray.deepClone(map.getArray(propKey)));
          break;
      }
    }
    return res;
  }

  /** @param keysAndValues keys and values, interleaved */
  private JavaOnlyMap(Object... keysAndValues) {
    if (keysAndValues.length % 2 != 0) {
      throw new IllegalArgumentException("You must provide the same number of keys and values");
    }
    mBackingMap = new HashMap();
    for (int i = 0; i < keysAndValues.length; i += 2) {
      Object val = keysAndValues[i + 1];
      if (val instanceof Number) {
        // all values from JS are doubles, so emulate that here for tests.
        val = ((Number)val).doubleValue();
      }
      mBackingMap.put(keysAndValues[i], val);
    }
  }

  public JavaOnlyMap() {
    mBackingMap = new HashMap();
  }

  @Override
  public boolean hasKey(@Nonnull String name) {
    return mBackingMap.containsKey(name);
  }

  @Override
  public boolean isNull(@Nonnull String name) {
    return mBackingMap.get(name) == null;
  }

  @Override
  public boolean getBoolean(@Nonnull String name) {
    return (Boolean) mBackingMap.get(name);
  }

  @Override
  public double getDouble(@Nonnull String name) {
    return ((Number) mBackingMap.get(name)).doubleValue();
  }

  @Override
  public int getInt(@Nonnull String name) {
    return ((Number) mBackingMap.get(name)).intValue();
  }

  @Override
  public String getString(@Nonnull String name) {
    return (String) mBackingMap.get(name);
  }

  @Override
  public ReadableMap getMap(@Nonnull String name) {
    return (ReadableMap) mBackingMap.get(name);
  }

  @Override
  public JavaOnlyArray getArray(@Nonnull String name) {
    return (JavaOnlyArray) mBackingMap.get(name);
  }

  @Override
  public @Nonnull Dynamic getDynamic(@Nonnull String name) {
    return DynamicFromMap.create(this, name);
  }

  @Override
  public @Nonnull ReadableType getType(@Nonnull String name) {
    Object value = mBackingMap.get(name);
    if (value == null) {
      return ReadableType.Null;
    } else if (value instanceof Number) {
      return ReadableType.Number;
    } else if (value instanceof String) {
      return ReadableType.String;
    } else if (value instanceof Boolean) {
      return ReadableType.Boolean;
    } else if (value instanceof ReadableMap) {
      return ReadableType.Map;
    } else if (value instanceof ReadableArray) {
      return ReadableType.Array;
    } else if (value instanceof Dynamic) {
      return ((Dynamic) value).getType();
    } else {
      throw new IllegalArgumentException(
          "Invalid value " + value.toString() + " for key " + name + "contained in JavaOnlyMap");
    }
  }

  @Override
  public @Nonnull Iterator<Map.Entry<String, Object>> getEntryIterator() {
    return mBackingMap.entrySet().iterator();
  }

  @Override
  public @Nonnull ReadableMapKeySetIterator keySetIterator() {
    return new ReadableMapKeySetIterator() {
      Iterator<Map.Entry<String, Object>> mIterator = mBackingMap.entrySet().iterator();

      @Override
      public boolean hasNextKey() {
        return mIterator.hasNext();
      }

      @Override
      public String nextKey() {
        return mIterator.next().getKey();
      }
    };
  }

  @Override
  public void putBoolean(@Nonnull String key, boolean value) {
    mBackingMap.put(key, value);
  }

  @Override
  public void putDouble(@Nonnull String key, double value) {
    mBackingMap.put(key, value);
  }

  @Override
  public void putInt(@Nonnull String key, int value) {
    mBackingMap.put(key, new Double(value));
  }

  @Override
  public void putString(@Nonnull String key, @Nullable String value) {
    mBackingMap.put(key, value);
  }

  @Override
  public void putNull(@Nonnull String key) {
    mBackingMap.put(key, null);
  }

  @Override
  public void putMap(@Nonnull String key, @Nullable WritableMap value) {
    mBackingMap.put(key, value);
  }

  @Override
  public void merge(@Nonnull ReadableMap source) {
    mBackingMap.putAll(((JavaOnlyMap) source).mBackingMap);
  }

  @Override
  public void putArray(@Nonnull String key, @Nullable WritableArray value) {
    mBackingMap.put(key, value);
  }

  @Override
  public @Nonnull HashMap<String, Object> toHashMap() {
    return new HashMap<String, Object>(mBackingMap);
  }

  @Override
  public String toString() {
    return mBackingMap.toString();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    JavaOnlyMap that = (JavaOnlyMap) o;

    if (mBackingMap != null ? !mBackingMap.equals(that.mBackingMap) : that.mBackingMap != null)
      return false;

    return true;
  }

  @Override
  public int hashCode() {
    return mBackingMap != null ? mBackingMap.hashCode() : 0;
  }
}
