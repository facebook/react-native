/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge.queue;

import androidx.annotation.Keep;
import com.facebook.jni.Countable;

/** A Runnable that has a native run implementation. */
@Keep
public class NativeRunnableDeprecated extends Countable implements Runnable {

  @Keep
  private NativeRunnableDeprecated() {}

  public native void run();
}
