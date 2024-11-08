/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;

@Implements(WritableNativeMap.class)
public class ShadowWritableNativeMap extends ShadowReadableNativeMap implements WritableMap {

  @Implementation
  protected void __constructor__() {
    super.__constructor__();
  }

  @Implementation
  public void putNull(@NonNull String key) {
    super.backingMap.putNull(key);
  }

  @Implementation
  public void putBoolean(@NonNull String key, boolean value) {
    super.backingMap.putBoolean(key, value);
  }

  @Implementation
  public void putDouble(@NonNull String key, double value) {
    super.backingMap.putDouble(key, value);
  }

  @Implementation
  public void putInt(@NonNull String key, int value) {
    super.backingMap.putInt(key, value);
  }

  @Implementation
  public void putLong(@NonNull String key, long value) {
    super.backingMap.putLong(key, value);
  }

  @Implementation
  public void putString(@NonNull String key, @Nullable String value) {
    super.backingMap.putString(key, value);
  }

  @Implementation
  public void putArray(@NonNull String key, @Nullable ReadableArray value) {
    super.backingMap.putArray(key, value);
  }

  @Implementation
  public void putMap(@NonNull String key, @Nullable ReadableMap value) {
    super.backingMap.putMap(key, value);
  }

  @Implementation
  public void merge(@NonNull ReadableMap source) {
    super.backingMap.merge(source);
  }

  @Implementation
  public WritableMap copy() {
    return super.backingMap.copy();
  }
}
