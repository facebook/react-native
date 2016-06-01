/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

import java.util.HashMap;


/**
 * Implementation of a read-only map in native memory. This will generally be constructed and filled
 * in native code so you shouldn't construct one yourself.
 */
@DoNotStrip
public class ReadableNativeMap extends NativeMap implements ReadableMap {

  static {
    SoLoader.loadLibrary(ReactBridge.REACT_NATIVE_LIB);
  }

  protected ReadableNativeMap(HybridData hybridData) {
    super(hybridData);
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

  public HashMap<String, Object> toHashMap() {
    ReadableMapKeySetIterator iterator = keySetIterator();
    HashMap<String, Object> hashMap = new HashMap<>();

    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      switch (getType(key)) {
        case Null:
          hashMap.put(key, null);
          break;
        case Boolean:
          hashMap.put(key, getBoolean(key));
          break;
        case Number:
          hashMap.put(key, getDouble(key));
          break;
        case String:
          hashMap.put(key, getString(key));
          break;
        case Map:
          hashMap.put(key, getMap(key).toHashMap());
          break;
        case Array:
          hashMap.put(key, getArray(key).toArrayList());
          break;
        default:
          throw new IllegalArgumentException("Could not convert object with key: " + key + ".");
      }
    }
    return hashMap;
  }

  /**
   * Implementation of a {@link ReadableNativeMap} iterator in native memory.
   */
  @DoNotStrip
  private static class ReadableNativeMapKeySetIterator implements ReadableMapKeySetIterator {
    @DoNotStrip
    private final HybridData mHybridData;

    // Need to hold a strong ref to the map so that our native references remain valid.
    @DoNotStrip
    private final ReadableNativeMap mMap;

    public ReadableNativeMapKeySetIterator(ReadableNativeMap readableNativeMap) {
      mMap = readableNativeMap;
      mHybridData = initHybrid(readableNativeMap);
    }

    @Override
    public native boolean hasNextKey();
    @Override
    public native String nextKey();

    private static native HybridData initHybrid(ReadableNativeMap readableNativeMap);
  }
}
