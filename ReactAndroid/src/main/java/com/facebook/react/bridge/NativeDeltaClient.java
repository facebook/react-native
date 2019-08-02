/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import java.nio.channels.ReadableByteChannel;

public class NativeDeltaClient {
  static {
    ReactBridge.staticInit();
  }

  // C++ parts
  private final HybridData mHybridData = initHybrid();

  private static native HybridData initHybrid();

  public native void reset();

  public native void processDelta(ReadableByteChannel deltaMessage);
}
