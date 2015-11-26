/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * A simple read/write map that can be used in tests in place of {@link WritableNativeMap}.
 */
public class SimpleMap implements ReadableMap, WritableMap {

  private final Map mBackingMap;

  public static SimpleMap of(Object... keysAndValues) {
    return new SimpleMap(keysAndValues);
  }

  /**
   * @param keysAndValues keys and values, interleaved
   */
  private SimpleMap(Object... keysAndValues) {
    if (keysAndValues.length % 2 != 0) {
      throw new IllegalArgumentException("You must provide the same number of keys and values");
    }
    mBackingMap = new HashMap();
    for (int i = 0; i < keysAndValues.length; i += 2) {
      mBackingMap.put(keysAndValues[i], keysAndValues[i + 1]);
    }
  }

  public SimpleMap() {
    mBackingMap = new HashMap();
  }

  @Override
  public boolean hasKey(String name) {
    return mBackingMap.containsKey(name);
  }

  @Override
  public boolean isNull(String name) {
    return mBackingMap.get(name) == null;
  }

  @Override
  public boolean getBoolean(String name) {
    return (Boolean) mBackingMap.get(name);
  }

  @Override
  public double getDouble(String name) {
    return (Double) mBackingMap.get(name);
  }

  @Override
  public int getInt(String name) {
    return (Integer) mBackingMap.get(name);
  }

  @Override
  public String getString(String name) {
    return (String) mBackingMap.get(name);
  }

  @Override
  public SimpleMap getMap(String name) {
    return (SimpleMap) mBackingMap.get(name);
  }

  @Override
  public SimpleArray getArray(String name) {
    return (SimpleArray) mBackingMap.get(name);
  }

  @Override
  public ReadableType getType(String name) {
    throw new UnsupportedOperationException("Method not implemented");
  }

  @Override
  public ReadableMapKeySetIterator keySetIterator() {
    return new ReadableMapKeySetIterator() {
      Iterator<String> mIterator = mBackingMap.keySet().iterator();

      @Override
      public boolean hasNextKey() {
        return mIterator.hasNext();
      }

      @Override
      public String nextKey() {
        return mIterator.next();
      }
    };
  }

  @Override
  public void putBoolean(String key, boolean value) {
    mBackingMap.put(key, value);
  }

  @Override
  public void putDouble(String key, double value) {
    mBackingMap.put(key, value);
  }

  @Override
  public void putInt(String key, int value) {
    mBackingMap.put(key, value);
  }

  @Override
  public void putString(String key, String value) {
    mBackingMap.put(key, value);
  }

  @Override
  public void putNull(String key) {
    mBackingMap.put(key, null);
  }

  @Override
  public void putMap(String key, WritableMap value) {
    mBackingMap.put(key, value);
  }

  @Override
  public void merge(ReadableMap source) {
    mBackingMap.putAll(((SimpleMap) source).mBackingMap);
  }

  @Override
  public void putArray(String key, WritableArray value) {
    mBackingMap.put(key, value);
  }

  @Override
  public String toString() {
    return mBackingMap.toString();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    SimpleMap that = (SimpleMap) o;

    if (mBackingMap != null ? !mBackingMap.equals(that.mBackingMap) : that.mBackingMap != null)
      return false;

    return true;
  }

  @Override
  public int hashCode() {
    return mBackingMap != null ? mBackingMap.hashCode() : 0;
  }
}
