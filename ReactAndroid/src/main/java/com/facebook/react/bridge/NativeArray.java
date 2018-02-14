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

/**
 * Base class for an array whose members are stored in native code (C++).
 */
@DoNotStrip
public abstract class NativeArray {
  static {
    ReactBridge.staticInit();
  }

  protected NativeArray(HybridData hybridData) {
    mHybridData = hybridData;
  }

  @Override
  public native String toString();

  @DoNotStrip
  private HybridData mHybridData;
}
