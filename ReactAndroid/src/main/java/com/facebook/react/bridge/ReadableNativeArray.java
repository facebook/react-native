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

import java.util.ArrayList;
import java.util.Arrays;
import com.facebook.infer.annotation.Assertions;
import javax.annotation.Nullable;

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

  //WriteOnce but not in the constructor fields
  private @Nullable Object[] mLocalArray;
  private @Nullable ReadableType[] mLocalTypeArray;

  private static int jniPassCounter = 0;
  private static boolean mUseNativeAccessor = false;
  public static void setUseNativeAccessor(boolean useNativeAccessor) {
    mUseNativeAccessor = useNativeAccessor;
  }
  public static int getJNIPassCounter() {
    return jniPassCounter;
  }

  private Object[] getLocalArray() {
    // Fast, non blocking check for the common case
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
    // Fast, non-blocking check for the common case
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
    if (mUseNativeAccessor) {
      jniPassCounter++;
      return sizeNative();
    }
    return getLocalArray().length;
  }
  private native int sizeNative();

  @Override
  public boolean isNull(int index) {
    if (mUseNativeAccessor) {
      jniPassCounter++;
      return isNullNative(index);
    }
    return getLocalArray()[index] == null;
  }
  private native boolean isNullNative(int index);

  @Override
  public boolean getBoolean(int index) {
    if (mUseNativeAccessor) {
      jniPassCounter++;
      return getBooleanNative(index);
    }
    return ((Boolean) getLocalArray()[index]).booleanValue();
  }
  private native boolean getBooleanNative(int index);

  @Override
  public double getDouble(int index) {
    if (mUseNativeAccessor) {
      jniPassCounter++;
      return getDoubleNative(index);
    }
    return ((Double) getLocalArray()[index]).doubleValue();
  }
  private native double getDoubleNative(int index);

  @Override
  public int getInt(int index) {
    if (mUseNativeAccessor) {
      jniPassCounter++;
      return getIntNative(index);
    }
    return ((Double) getLocalArray()[index]).intValue();
  }
  private native int getIntNative(int index);

  @Override
  public String getString(int index) {
    if (mUseNativeAccessor) {
      jniPassCounter++;
      return getStringNative(index);
    }
    return (String) getLocalArray()[index];
  }
  private native String getStringNative(int index);

  @Override
  public ReadableNativeArray getArray(int index) {
    if (mUseNativeAccessor) {
      jniPassCounter++;
      return getArrayNative(index);
    }
    return (ReadableNativeArray) getLocalArray()[index];
  }
  private native ReadableNativeArray getArrayNative(int index);

  @Override
  public ReadableNativeMap getMap(int index) {
    if (mUseNativeAccessor) {
      jniPassCounter++;
      return getMapNative(index);
    }
    return (ReadableNativeMap) getLocalArray()[index];
  }
  private native ReadableNativeMap getMapNative(int index);

  @Override
  public ReadableType getType(int index) {
    if (mUseNativeAccessor) {
      jniPassCounter++;
      return getTypeNative(index);
    }
    return getLocalTypeArray()[index];
  }

  private native ReadableType getTypeNative(int index);

  @Override
  public Dynamic getDynamic(int index) {
    return DynamicFromArray.create(this, index);
  }

  @Override
  public ArrayList<Object> toArrayList() {
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
