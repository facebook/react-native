/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static com.facebook.react.bridge.Arguments.*;

import com.facebook.jni.HybridClassBase;
import com.facebook.proguard.annotations.DoNotStrip;

/** Callback impl that calls directly into the cxx bridge. Created from C++. */
@DoNotStrip
public class CxxCallbackImpl extends HybridClassBase implements Callback {

  @DoNotStrip
  private CxxCallbackImpl() {}

  @Override
  public void invoke(Object... args) {
    nativeInvoke(fromJavaArgs(args));
  }

  private native void nativeInvoke(NativeArray arguments);
}
