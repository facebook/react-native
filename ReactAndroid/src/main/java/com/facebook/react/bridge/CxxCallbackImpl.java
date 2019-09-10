// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

import static com.facebook.react.bridge.Arguments.*;

import androidx.annotation.Keep;
import com.facebook.jni.HybridData;

/** Callback impl that calls directly into the cxx bridge. Created from C++. */
@Keep
public class CxxCallbackImpl implements Callback {
  @Keep private final HybridData mHybridData;

  @Keep
  private CxxCallbackImpl(HybridData hybridData) {
    mHybridData = hybridData;
  }

  @Override
  public void invoke(Object... args) {
    nativeInvoke(fromJavaArgs(args));
  }

  private native void nativeInvoke(NativeArray arguments);
}
