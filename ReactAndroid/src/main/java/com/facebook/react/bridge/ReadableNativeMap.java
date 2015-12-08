/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import com.facebook.jni.Countable;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

import java.util.HashMap;
import java.util.Map;

/**
 * Implementation of a read-only map in native memory. This will generally be constructed and filled
 * in native code so you shouldn't construct one yourself.
 */
@DoNotStrip
public class ReadableNativeMap extends NativeMap implements ReadableMap {

  static {
    SoLoader.loadLibrary(ReactBridge.REACT_NATIVE_LIB);
  }

  @Override
  public native boolean hasKey(String name);
  @Override
  public native boolean isNull(String name);
  @Override
  public native boolean getBoolean(String name);
  @Override
  public native double getDouble(String name);
  @Override
  public native int getInt(String name);
  @Override
  public native String getString(String name);
  @Override
  public native ReadableNativeArray getArray(String name);
  @Override
  public native ReadableNativeMap getMap(String name);
  @Override
  public native ReadableType getType(String name);

  @Override
  public ReadableMapKeySetIterator keySetIterator() {
    return new ReadableNativeMapKeySetIterator(this);
  }

  public Map<String, Object> toJavaMap() {
    return ReadableNativeMap.toJavaMap(this);
  }

  public static Map<String, Object>toJavaMap(ReadableNativeMap map) {
    ReadableNativeMapKeySetIterator iterator = map.keySetIterator();
    Map<String, Object> unwrappedMap = new HashMap<>();
    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      ReadableType type = map.getType(type);
      switch (type) {
        case Null:
          unwrappedMap.put(key, null);
          break;
        case Boolean:
          unwrappedMap.put(key, map.getBoolean(type));
          break;
        case Number:
          unwrappedMap.put(key, map.getDouble(type));
          break;
        case Map:
          unwrappedMap.put(key, ReadableNativeMap.toJavaMap(map.getMap(key)));
          break;
        case Array:
          unwrappedMap.put(key, map.getArray(key).toJavaArray());
          break;
        default:
          throw new IllegalArgumentException("Could not convert object with key: " + key + ".");
      }
    }
    return unwrappedMap;
  }

  /**
   * Implementation of a {@link ReadableNativeMap} iterator in native memory.
   */
  @DoNotStrip
  private static class ReadableNativeMapKeySetIterator extends Countable
      implements ReadableMapKeySetIterator {

    private final ReadableNativeMap mReadableNativeMap;

    public ReadableNativeMapKeySetIterator(ReadableNativeMap readableNativeMap) {
      mReadableNativeMap = readableNativeMap;
      initialize(mReadableNativeMap);
    }

    @Override
    public native boolean hasNextKey();
    @Override
    public native String nextKey();

    private native void initialize(ReadableNativeMap readableNativeMap);
  }
}
