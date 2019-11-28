/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.jni.HybridData;

/** A Runnable that has a native run implementation. */
@DoNotStrip
public class NativeRunnableDeprecated implements Runnable {

  @DoNotStrip
  private final HybridData mHybridData;

  @DoNotStrip
  private NativeRunnableDeprecated(HybridData hybridData) {
    mHybridData = hybridData;
  }

  public native void run();
}
