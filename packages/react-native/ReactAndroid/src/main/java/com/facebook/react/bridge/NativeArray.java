/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.jni.HybridClassBase;
import com.facebook.proguard.annotations.DoNotStrip;

/** Base class for an array whose members are stored in native code (C++). */
@DoNotStrip
public abstract class NativeArray extends HybridClassBase implements NativeArrayInterface {
  static {
    ReactBridge.staticInit();
  }

  protected NativeArray() {}

  @Override
  public native String toString();
}
