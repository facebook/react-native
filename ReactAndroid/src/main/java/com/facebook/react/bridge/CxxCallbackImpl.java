// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

import static com.facebook.react.bridge.Arguments.*;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/** Callback impl that calls directly into the cxx bridge. Created from C++. */
@DoNotStrip
public class CxxCallbackImpl implements Callback {
  @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private CxxCallbackImpl(HybridData hybridData) {
    mHybridData = hybridData;
  }

  @Override
  public void invoke(Object... args) {
    nativeInvoke(fromJavaArgs(args));
  }

  private native void nativeInvoke(NativeArray arguments);
}
