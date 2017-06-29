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
