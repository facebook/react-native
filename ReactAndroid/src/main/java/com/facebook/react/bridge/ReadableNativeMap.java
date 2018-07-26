/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

import java.util.HashMap;
import java.util.Iterator;

import com.facebook.infer.annotation.Assertions;
import javax.annotation.Nullable;

/**
 * Implementation of a read-only map in native memory. This will generally be constructed and filled
 * in native code so you shouldn't construct one yourself.
 */
@DoNotStrip
public class ReadableNativeMap extends NativeMap implements ReadableMap {
  static {
    ReactBridge.staticInit();
  }

  protected ReadableNativeMap(HybridData hybridData) {
    super(hybridData);
  }

  private @Nullable String[] mKeys;
  private @Nullable HashMap<String,Object> mLocalMap;
  private @Nullable HashMap<String,ReadableType> mLocalTypeMap;
  private static boolean mUseNativeAccessor;
  private static int mJniCallCounter;
  public static void setUseNativeAccessor(boolean useNativeAccessor) {
    mUseNativeAccessor = useNativeAccessor;
  }
  public static int getJNIPassCounter() {
    return mJniCallCounter;
  }

  private HashMap<String,Object> getLocalMap() {
    // Fast return for the common case
    if (mLocalMap != null) {
      return mLocalMap;
    }
    // Check and when necessary get keys atomicaly
    synchronized (this) {
      if (mKeys == null) {
        mKeys = Assertions.assertNotNull(importKeys());
        mJniCallCounter++;
      }
      if (mLocalMap == null) {
        Object[] values = Assertions.assertNotNull(importValues());
        mJniCallCounter++;
        mLocalMap = new HashMap<>();
        for(int i = 0; i< mKeys.length; i++) {
          mLocalMap.put(mKeys[i], values[i]);
        }
      }
    }
    return mLocalMap;
  }
  private native String[] importKeys();
  private native Object[] importValues();

  private HashMap<String,ReadableType> getLocalTypeMap() {
    // Fast and non-blocking return for common case
    if (mLocalTypeMap != null) {
      return mLocalTypeMap;
    }
    // Check and when necessary get keys
    synchronized (this) {
      if (mKeys == null) {
        mKeys = Assertions.assertNotNull(importKeys());
        mJniCallCounter++;
      }
      // check that no other thread has already updated
      if (mLocalTypeMap == null) {
        Object[] types = Assertions.assertNotNull(importTypes());
        mJniCallCounter++;
        mLocalTypeMap = new HashMap<>();
        for(int i = 0; i< mKeys.length; i++) {
          mLocalTypeMap.put(mKeys[i], (ReadableType) types[i]);
        }
      }
    }
    return mLocalTypeMap;
  }
  private native Object[] importTypes();

  @Override
  public boolean hasKey(String name) {
    if (mUseNativeAccessor) {
      mJniCallCounter++;
      return hasKeyNative(name);
    }
    return getLocalMap().containsKey(name);
  }
  private native boolean hasKeyNative(String name);

  @Override
  public boolean isNull(String name) {
    if (mUseNativeAccessor) {
      mJniCallCounter++;
      return isNullNative(name);
    }
    if (getLocalMap().containsKey(name)) {
      return getLocalMap().get(name) == null;
    }
    throw new NoSuchKeyException(name);
  }
  private native boolean isNullNative(String name);

  private Object getValue(String name) {
    if (hasKey(name) && !(isNull(name))) {
      return Assertions.assertNotNull(getLocalMap().get(name));
    }
    throw new NoSuchKeyException(name);
  }

  private <T> T getValue(String name, Class<T> type) {
    Object value = getValue(name);
    checkInstance(name, value, type);
    return (T) value;
  }

  private @Nullable Object getNullableValue(String name) {
    if (hasKey(name)) {
      return getLocalMap().get(name);
    }
    throw new NoSuchKeyException(name);
  }

  private @Nullable <T> T getNullableValue(String name, Class<T> type) {
    Object value = getNullableValue(name);
    checkInstance(name, value, type);
    return (T) value;
  }

  private void checkInstance(String name, Object value, Class type) {
    if (value != null && !type.isInstance(value)) {
      throw new ClassCastException(
        "Value for " + name + " cannot be cast from " +
          value.getClass().getSimpleName() + " to " + type.getSimpleName());
    }
  }

  @Override
  public boolean getBoolean(String name) {
    if (mUseNativeAccessor) {
      mJniCallCounter++;
      return getBooleanNative(name);
    }
    return getValue(name, Boolean.class).booleanValue();
  }
  private native boolean getBooleanNative(String name);

  @Override
  public double getDouble(String name) {
    if (mUseNativeAccessor) {
      mJniCallCounter++;
      return getDoubleNative(name);
    }
    return getValue(name, Double.class).doubleValue();
  }
  private native double getDoubleNative(String name);

  @Override
  public int getInt(String name) {
    if (mUseNativeAccessor) {
      mJniCallCounter++;
      return getIntNative(name);
    }

    // All numbers coming out of native are doubles, so cast here then truncate
    return getValue(name, Double.class).intValue();
  }
  private native int getIntNative(String name);

  @Override
  public @Nullable String getString(String name) {
    if (mUseNativeAccessor) {
      mJniCallCounter++;
      return getStringNative(name);
    }
    return getNullableValue(name, String.class);
  }
  private native String getStringNative(String name);

  @Override
  public @Nullable ReadableArray getArray(String name) {
    if (mUseNativeAccessor) {
      mJniCallCounter++;
      return getArrayNative(name);
    }
    return getNullableValue(name, ReadableArray.class);
  }
  private native ReadableNativeArray getArrayNative(String name);

  @Override
  public @Nullable ReadableNativeMap getMap(String name) {
    if (mUseNativeAccessor) {
      mJniCallCounter++;
      return getMapNative(name);
    }
    return getNullableValue(name, ReadableNativeMap.class);
  }
  private native ReadableNativeMap getMapNative(String name);

  @Override
  public ReadableType getType(String name) {
    if (mUseNativeAccessor) {
      mJniCallCounter++;
      return getTypeNative(name);
    }
    if (getLocalTypeMap().containsKey(name)) {
      return Assertions.assertNotNull(getLocalTypeMap().get(name));
    }
    throw new NoSuchKeyException(name);
  }
  private native ReadableType getTypeNative(String name);

  @Override
  public Dynamic getDynamic(String name) {
    return DynamicFromMap.create(this, name);
  }

  @Override
  public ReadableMapKeySetIterator keySetIterator() {
    return new ReadableNativeMapKeySetIterator(this);
  }

  @Override
  public HashMap<String, Object> toHashMap() {
    if (mUseNativeAccessor) {
      ReadableMapKeySetIterator iterator = keySetIterator();
      HashMap<String, Object> hashMap = new HashMap<>();

      while (iterator.hasNextKey()) {
        // increment for hasNextKey call
        mJniCallCounter++;
        String key = iterator.nextKey();
        // increment for nextKey call
        mJniCallCounter++;
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
            hashMap.put(key, Assertions.assertNotNull(getMap(key)).toHashMap());
            break;
          case Array:
            hashMap.put(key, Assertions.assertNotNull(getArray(key)).toArrayList());
            break;
          default:
            throw new IllegalArgumentException("Could not convert object with key: " + key + ".");
          }
        }
      return hashMap;
    }

    // we can almost just return getLocalMap(), but we need to convert nested arrays and maps to the
    // correct types first
    HashMap<String, Object> hashMap = new HashMap<>(getLocalMap());
    Iterator iterator = hashMap.keySet().iterator();

    while (iterator.hasNext()) {
      String key = (String) iterator.next();
      switch (getType(key)) {
        case Null:
        case Boolean:
        case Number:
        case String:
          break;
        case Map:
          hashMap.put(key, Assertions.assertNotNull(getMap(key)).toHashMap());
          break;
        case Array:
          hashMap.put(key, Assertions.assertNotNull(getArray(key)).toArrayList());
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
