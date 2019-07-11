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

/**
 * Implementation of a write-only map stored in native memory. Use {@link Arguments#createMap()} if
 * you need to stub out creating this class in a test. TODO(5815532): Check if consumed on read
 */
@DoNotStrip
public class WritableNativeMap extends ReadableNativeMap implements WritableMap {
  static {
    ReactBridge.staticInit();
  }

  @Override
  public native void putBoolean(@NonNull String key, boolean value);

  @Override
  public native void putDouble(@NonNull String key, double value);

  @Override
  public native void putInt(@NonNull String key, int value);

  @Override
  public native void putNull(@NonNull String key);

  @Override
  public native void putString(@NonNull String key, @Nullable String value);

  @Override
  public void putMap(@NonNull String key, @Nullable ReadableMap value) {
    Assertions.assertCondition(
        value == null || value instanceof WritableNativeMap, "Illegal type provided");
    putNativeMap(key, (WritableNativeMap) value);
  }

  // Note: this consumes the map so do not reuse it.
  @Override
  public void putArray(@NonNull String key, @Nullable ReadableArray value) {
    Assertions.assertCondition(
        value == null || value instanceof WritableNativeArray, "Illegal type provided");
    putNativeArray(key, (WritableNativeArray) value);
  }

  // Note: this **DOES NOT** consume the source map
  @Override
  public void merge(@NonNull ReadableMap source) {
    Assertions.assertCondition(source instanceof ReadableNativeMap, "Illegal type provided");
    mergeNativeMap((ReadableNativeMap) source);
  }

  @Override
  public WritableMap copy() {
    final WritableNativeMap target = new WritableNativeMap();
    target.merge(this);
    return target;
  }

  public WritableNativeMap() {
    super(initHybrid());
  }

  private static native HybridData initHybrid();

  private native void putNativeMap(String key, WritableNativeMap value);

  private native void putNativeArray(String key, WritableNativeArray value);

  private native void mergeNativeMap(ReadableNativeMap source);
}
