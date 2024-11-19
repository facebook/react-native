/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.bridge.ReadableType;
import java.util.ArrayList;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;

@Implements(ReadableNativeArray.class)
public class ShadowReadableNativeArray extends ShadowNativeArray implements ReadableArray {

  protected JavaOnlyArray backingArray;

  @Implementation
  protected void __constructor__() {
    this.backingArray = new JavaOnlyArray();
  }

  @Implementation
  public int size() {
    return this.backingArray.size();
  }

  @Implementation
  public boolean isNull(int index) {
    return this.backingArray.isNull(index);
  }

  @Implementation
  public boolean getBoolean(int index) {
    return this.backingArray.getBoolean(index);
  }

  @Implementation
  public double getDouble(int index) {
    return this.backingArray.getDouble(index);
  }

  @Implementation
  public int getInt(int index) {
    return this.backingArray.getInt(index);
  }

  @Implementation
  public long getLong(int index) {
    return this.backingArray.getLong(index);
  }

  @Implementation
  public @NonNull String getString(int index) {
    return this.backingArray.getString(index);
  }

  @Implementation
  public @NonNull ReadableArray getArray(int index) {
    return this.backingArray.getArray(index);
  }

  @Implementation
  public @NonNull ReadableMap getMap(int index) {
    return this.backingArray.getMap(index);
  }

  @Implementation
  public @NonNull Dynamic getDynamic(int index) {
    return this.backingArray.getDynamic(index);
  }

  @Implementation
  public @NonNull ReadableType getType(int index) {
    return this.backingArray.getType(index);
  }

  @Implementation
  public @NonNull ArrayList<Object> toArrayList() {
    return this.backingArray.toArrayList();
  }
}
