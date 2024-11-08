/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;

@Implements(WritableNativeArray.class)
public class ShadowWritableNativeArray extends ShadowReadableNativeArray implements WritableArray {

  @Implementation
  protected void __constructor__() {
    super.__constructor__();
  }

  @Implementation
  public void pushNull() {
    super.backingArray.pushNull();
  }

  @Implementation
  public void pushBoolean(boolean value) {
    super.backingArray.pushBoolean(value);
  }

  @Implementation
  public void pushDouble(double value) {
    super.backingArray.pushDouble(value);
  }

  @Implementation
  public void pushInt(int value) {
    super.backingArray.pushInt(value);
  }

  @Implementation
  public void pushLong(long value) {
    super.backingArray.pushLong(value);
  }

  @Implementation
  public void pushString(@Nullable String value) {
    super.backingArray.pushString(value);
  }

  @Implementation
  public void pushArray(@Nullable ReadableArray array) {
    super.backingArray.pushArray(array);
  }

  @Implementation
  public void pushMap(@Nullable ReadableMap map) {
    super.backingArray.pushMap(map);
  }
}
