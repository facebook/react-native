/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.ReadableType;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;

@Implements(ReadableNativeMap.class)
public class ShadowReadableNativeMap extends ShadowNativeMap implements ReadableMap {

  protected JavaOnlyMap backingMap;

  @Implementation
  protected void __constructor__() {
    this.backingMap = new JavaOnlyMap();
  }

  @Implementation
  public boolean hasKey(@NonNull String name) {
    return backingMap.hasKey(name);
  }

  @Implementation
  public boolean isNull(@NonNull String name) {
    return backingMap.isNull(name);
  }

  @Implementation
  public boolean getBoolean(@NonNull String name) {
    return backingMap.getBoolean(name);
  }

  @Implementation
  public double getDouble(@NonNull String name) {
    return backingMap.getDouble(name);
  }

  @Implementation
  public int getInt(@NonNull String name) {
    return backingMap.getInt(name);
  }

  @Implementation
  public long getLong(@NonNull String name) {
    return backingMap.getLong(name);
  }

  @Implementation
  public @Nullable String getString(@NonNull String name) {
    return backingMap.getString(name);
  }

  @Implementation
  public @Nullable ReadableArray getArray(@NonNull String name) {
    return backingMap.getArray(name);
  }

  @Implementation
  public @Nullable ReadableMap getMap(@NonNull String name) {
    return backingMap.getMap(name);
  }

  @Implementation
  public @NonNull Dynamic getDynamic(@NonNull String name) {
    return backingMap.getDynamic(name);
  }

  @Implementation
  public @NonNull ReadableType getType(@NonNull String name) {
    return backingMap.getType(name);
  }

  @Implementation
  public @NonNull Iterator<Map.Entry<String, Object>> getEntryIterator() {
    return backingMap.getEntryIterator();
  }

  @Implementation
  public @NonNull ReadableMapKeySetIterator keySetIterator() {
    return backingMap.keySetIterator();
  }

  @Implementation
  public @NonNull HashMap<String, Object> toHashMap() {
    return backingMap.toHashMap();
  }
}
