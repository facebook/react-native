/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

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
  private @Nullable HashMap<String, Object> mLocalMap;
  private @Nullable HashMap<String, ReadableType> mLocalTypeMap;
  private static int mJniCallCounter;

  public static int getJNIPassCounter() {
    return mJniCallCounter;
  }

  private HashMap<String, Object> getLocalMap() {
    if (mLocalMap != null) {
      return mLocalMap;
    }
    synchronized (this) {
      if (mKeys == null) {
        mKeys = Assertions.assertNotNull(importKeys());
        mJniCallCounter++;
      }
      if (mLocalMap == null) {
        Object[] values = Assertions.assertNotNull(importValues());
        mJniCallCounter++;
        int length = mKeys.length;
        mLocalMap = new HashMap<>(length);
        for (int i = 0; i < length; i++) {
          mLocalMap.put(mKeys[i], values[i]);
        }
      }
    }
    return mLocalMap;
  }

  private native String[] importKeys();

  private native Object[] importValues();

  private @NonNull HashMap<String, ReadableType> getLocalTypeMap() {
    if (mLocalTypeMap != null) {
      return mLocalTypeMap;
    }
    synchronized (this) {
      if (mKeys == null) {
        mKeys = Assertions.assertNotNull(importKeys());
        mJniCallCounter++;
      }
      // check that no other thread has already updated
      if (mLocalTypeMap == null) {
        Object[] types = Assertions.assertNotNull(importTypes());
        mJniCallCounter++;
        int length = mKeys.length;
        mLocalTypeMap = new HashMap<>(length);
        for (int i = 0; i < length; i++) {
          mLocalTypeMap.put(mKeys[i], (ReadableType) types[i]);
        }
      }
    }
    return mLocalTypeMap;
  }

  private native Object[] importTypes();

  @Override
  public boolean hasKey(@NonNull String name) {
    return getLocalMap().containsKey(name);
  }

  @Override
  public boolean isNull(@NonNull String name) {
    if (getLocalMap().containsKey(name)) {
      return getLocalMap().get(name) == null;
    }
    throw new NoSuchKeyException(name);
  }

  private @NonNull Object getValue(@NonNull String name) {
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
      throw new UnexpectedNativeTypeException(
          "Value for "
              + name
              + " cannot be cast from "
              + value.getClass().getSimpleName()
              + " to "
              + type.getSimpleName());
    }
  }

  @Override
  public boolean getBoolean(@NonNull String name) {
    return getValue(name, Boolean.class).booleanValue();
  }

  @Override
  public double getDouble(@NonNull String name) {
    return getValue(name, Double.class).doubleValue();
  }

  @Override
  public int getInt(@NonNull String name) {
    // All numbers coming out of native are doubles, so cast here then truncate
    return getValue(name, Double.class).intValue();
  }

  @Override
  public @Nullable String getString(@NonNull String name) {
    return getNullableValue(name, String.class);
  }

  @Override
  public @Nullable ReadableArray getArray(@NonNull String name) {
    return getNullableValue(name, ReadableArray.class);
  }

  @Override
  public @Nullable ReadableNativeMap getMap(@NonNull String name) {
    return getNullableValue(name, ReadableNativeMap.class);
  }

  @Override
  public @NonNull ReadableType getType(@NonNull String name) {
    if (getLocalTypeMap().containsKey(name)) {
      return Assertions.assertNotNull(getLocalTypeMap().get(name));
    }
    throw new NoSuchKeyException(name);
  }

  @Override
  public @NonNull Dynamic getDynamic(@NonNull String name) {
    return DynamicFromMap.create(this, name);
  }

  @Override
  public @NonNull Iterator<Map.Entry<String, Object>> getEntryIterator() {
    return getLocalMap().entrySet().iterator();
  }

  @Override
  public @NonNull ReadableMapKeySetIterator keySetIterator() {
    return new ReadableNativeMapKeySetIterator(this);
  }

  @Override
  public int hashCode() {
    return getLocalMap().hashCode();
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof ReadableNativeMap)) {
      return false;
    }
    ReadableNativeMap other = (ReadableNativeMap) obj;
    return getLocalMap().equals(other.getLocalMap());
  }

  @Override
  public @NonNull HashMap<String, Object> toHashMap() {
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

  private static class ReadableNativeMapKeySetIterator implements ReadableMapKeySetIterator {
    private final Iterator<String> mIterator;

    public ReadableNativeMapKeySetIterator(ReadableNativeMap readableNativeMap) {
      mIterator = readableNativeMap.getLocalMap().keySet().iterator();
    }

    @Override
    public boolean hasNextKey() {
      return mIterator.hasNext();
    }

    @Override
    public String nextKey() {
      return mIterator.next();
    }
  }
}
