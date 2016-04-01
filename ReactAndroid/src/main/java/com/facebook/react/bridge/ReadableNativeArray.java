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

import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of a NativeArray that allows read-only access to its members. This will generally
 * be constructed and filled in native code so you shouldn't construct one yourself.
 */
@DoNotStrip
public class ReadableNativeArray extends NativeArray implements ReadableArray {

  static {
    SoLoader.loadLibrary(ReactBridge.REACT_NATIVE_LIB);
  }

  protected ReadableNativeArray(HybridData hybridData) {
    super(hybridData);
  }

  @Override
  public native int size();
  @Override
  public native boolean isNull(int index);
  @Override
  public native boolean getBoolean(int index);
  @Override
  public native double getDouble(int index);
  @Override
  public native int getInt(int index);
  @Override
  public native String getString(int index);
  @Override
  public native ReadableNativeArray getArray(int index);
  @Override
  public native ReadableNativeMap getMap(int index);
  @Override
  public native ReadableType getType(int index);

  public List<Object> toJavaArray() {
    return ReadableNativeArray.toJavaArray(this);
  }

  public static List<Object> toJavaArray(ReadableNativeArray readableArray) {
    List<Object> unwrappedList = new ArrayList<>(readableArray.size());
    for (int i = 0; i < readableArray.size(); i++) {
      ReadableType type = readableArray.getType(i);
      switch (type) {
        case Null:
          unwrappedList.add(i, null);
          break;
        case Boolean:
          unwrappedList.add(i, readableArray.getBoolean(i));
          break;
        case Number:
          unwrappedList.add(i, readableArray.getDouble(i));
          break;
        case String:
          unwrappedList.add(i, readableArray.getString(i));
          break;
        case Map:
          unwrappedList.add(i, readableArray.getMap(i).toJavaMap());
          break;
        case Array:
          unwrappedList.add(i, ReadableNativeArray.toJavaArray(readableArray.getArray(i)));
          break;
        default:
          throw new IllegalArgumentsException("Could not convert object at index " + i + ".");
      }
    }
    return unwrappedList;
  }
}
