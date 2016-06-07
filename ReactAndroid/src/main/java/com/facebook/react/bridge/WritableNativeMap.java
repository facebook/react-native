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
import com.facebook.infer.annotation.Assertions;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

/**
 * Implementation of a write-only map stored in native memory. Use
 * {@link Arguments#createMap()} if you need to stub out creating this class in a test.
 * TODO(5815532): Check if consumed on read
 */
@DoNotStrip
public class WritableNativeMap extends ReadableNativeMap implements WritableMap {
  static {
    ReactBridge.staticInit();
  }

  @Override
  public native void putBoolean(String key, boolean value);
  @Override
  public native void putDouble(String key, double value);
  @Override
  public native void putInt(String key, int value);
  @Override
  public native void putString(String key, String value);
  @Override
  public native void putNull(String key);

  // Note: this consumes the map so do not reuse it.
  @Override
  public void putMap(String key, WritableMap value) {
    Assertions.assertCondition(
        value == null || value instanceof WritableNativeMap, "Illegal type provided");
    putNativeMap(key, (WritableNativeMap) value);
  }

  // Note: this consumes the map so do not reuse it.
  @Override
  public void putArray(String key, WritableArray value) {
    Assertions.assertCondition(
        value == null || value instanceof WritableNativeArray, "Illegal type provided");
    putNativeArray(key, (WritableNativeArray) value);
  }

  // Note: this **DOES NOT** consume the source map
  @Override
  public void merge(ReadableMap source) {
    Assertions.assertCondition(source instanceof ReadableNativeMap, "Illegal type provided");
    mergeNativeMap((ReadableNativeMap) source);
  }

  public WritableNativeMap() {
    super(initHybrid());
  }

  private static native HybridData initHybrid();

  private native void putNativeMap(String key, WritableNativeMap value);
  private native void putNativeArray(String key, WritableNativeArray value);
  private native void mergeNativeMap(ReadableNativeMap source);
}
