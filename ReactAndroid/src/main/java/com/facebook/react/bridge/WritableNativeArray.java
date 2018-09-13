/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.infer.annotation.Assertions;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Implementation of a write-only array stored in native memory. Use
 * {@link Arguments#createArray()} if you need to stub out creating this class in a test.
 * TODO(5815532): Check if consumed on read
 */
@DoNotStrip
public class WritableNativeArray extends ReadableNativeArray implements WritableArray {
  static {
    ReactBridge.staticInit();
  }

  public WritableNativeArray() {
    super(initHybrid());
  }

  @Override
  public native void pushNull();
  @Override
  public native void pushBoolean(boolean value);
  @Override
  public native void pushDouble(double value);
  @Override
  public native void pushInt(int value);
  @Override
  public native void pushString(String value);

  // Note: this consumes the map so do not reuse it.
  @Override
  public void pushArray(WritableArray array) {
    Assertions.assertCondition(
        array == null || array instanceof WritableNativeArray, "Illegal type provided");
    pushNativeArray((WritableNativeArray) array);
  }

  // Note: this consumes the map so do not reuse it.
  @Override
  public void pushMap(WritableMap map) {
    Assertions.assertCondition(
        map == null || map instanceof WritableNativeMap, "Illegal type provided");
    pushNativeMap((WritableNativeMap) map);
  }

  private static native HybridData initHybrid();
  private native void pushNativeArray(WritableNativeArray array);
  private native void pushNativeMap(WritableNativeMap map);
}
