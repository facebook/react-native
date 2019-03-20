/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import java.nio.channels.ReadableByteChannel;

import com.facebook.jni.HybridData;

public class NativeDeltaClient {
  static {
    ReactBridge.staticInit();
  }

  // C++ parts
  private final HybridData mHybridData = initHybrid();
  private native static HybridData initHybrid();

  public native void reset();
  public native void processDelta(ReadableByteChannel deltaMessage);
}
