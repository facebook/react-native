/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge.queue;

import com.facebook.jni.Countable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * A Runnable that has a native run implementation.
 */
@DoNotStrip
public class NativeRunnableDeprecated extends Countable implements Runnable {

  @DoNotStrip
  private NativeRunnableDeprecated() {
  }

  public native void run();
}
