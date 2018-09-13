/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
