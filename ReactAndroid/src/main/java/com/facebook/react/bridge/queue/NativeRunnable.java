/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge.queue;

import androidx.annotation.Keep;
import com.facebook.jni.HybridData;

/** A Runnable that has a native run implementation. */
@Keep
public class NativeRunnable implements Runnable {

  private final HybridData mHybridData;

  @Keep
  private NativeRunnable(HybridData hybridData) {
    mHybridData = hybridData;
  }

  public native void run();
}
