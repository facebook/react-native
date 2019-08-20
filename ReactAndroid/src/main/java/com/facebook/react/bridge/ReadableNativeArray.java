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
import java.util.ArrayList;
import java.util.Arrays;

/**
 * Implementation of a NativeArray that allows read-only access to its members. This will generally
 * be constructed and filled in native code so you shouldn't construct one yourself.
 */
@DoNotStrip
public class ReadableNativeArray extends NativeArray implements ReadableArray {
  static {
    ReactBridge.staticInit();
  }

  protected ReadableNativeArray(HybridData hybridData) {
    super(hybridData);
  }

  // WriteOnce but not in the constructor fields
  private @Nullable Object[] mLocalArray;
  private @Nullable ReadableType[] mLocalTypeArray;

  private static int jniPassCounter = 0;

  public static int getJNIPassCounter() {
    return jniPassCounter;
  }

  private Object[] getLocalArray() {
    if (mLocalArray != null) {
      return mLocalArray;
    }
    synchronized (this) {
      // Make sure no concurrent call already updated
      if (mLocalArray == null) {
        jniPassCounter++;
        mLocalArray = Assertions.assertNotNull(importArray());
      }
    }
    return mLocalArray;
  }

  private native Object[] importArray();

  private ReadableType[] getLocalTypeArray() {
    if (mLocalTypeArray != null) {
      return mLocalTypeArray;
    }
    synchronized (this) {
      // Make sure no concurrent call already updated
      if (mLocalTypeArray == null) {
        jniPassCounter++;
        Object[] tempArray = Assertions.assertNotNull(importTypeArray());
        mLocalTypeArray = Arrays.copyOf(tempArray, tempArray.length, ReadableType[].class);
      }
    }
    return mLocalTypeArray;
  }

  private native Object[] importTypeArray();

  @Override
  public int size() {
    return getLocalArray().length;
  }

  @Override
  public boolean isNull(int index) {
    return getLocalArray()[index] == null;
  }

  @Override
  public boolean getBoolean(int index) {
    return ((Boolean) getLocalArray()[index]).booleanValue();
  }

  @Override
  public double getDouble(int index) {
    return ((Double) getLocalArray()[index]).doubleValue();
  }

  @Override
  public int getInt(int index) {
    return ((Double) getLocalArray()[index]).intValue();
  }

  @Override
  public @Nullable String getString(int index) {
    return (String) getLocalArray()[index];
  }

  @Override
  public @Nullable ReadableNativeArray getArray(int index) {
    return (ReadableNativeArray) getLocalArray()[index];
  }

  @Override
  public @Nullable ReadableNativeMap getMap(int index) {
    return (ReadableNativeMap) getLocalArray()[index];
  }

  @Override
  public @NonNull ReadableType getType(int index) {
    return getLocalTypeArray()[index];
  }

  @Override
  public @NonNull Dynamic getDynamic(int index) {
    return DynamicFromArray.create(this, index);
  }

  @Override
  public int hashCode() {
    return getLocalArray().hashCode();
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof ReadableNativeArray)) {
      return false;
    }
    ReadableNativeArray other = (ReadableNativeArray) obj;
    return Arrays.deepEquals(getLocalArray(), other.getLocalArray());
  }

  @Override
  public @NonNull ArrayList<Object> toArrayList() {
    ArrayList<Object> arrayList = new ArrayList<>();

    for (int i = 0; i < this.size(); i++) {
      switch (getType(i)) {
        case Null:
          arrayList.add(null);
          break;
        case Boolean:
          arrayList.add(getBoolean(i));
          break;
        case Number:
          arrayList.add(getDouble(i));
          break;
        case String:
          arrayList.add(getString(i));
          break;
        case Map:
          arrayList.add(getMap(i).toHashMap());
          break;
        case Array:
          arrayList.add(getArray(i).toArrayList());
          break;
        default:
          throw new IllegalArgumentException("Could not convert object at index: " + i + ".");
      }
    }
    return arrayList;
  }
}
