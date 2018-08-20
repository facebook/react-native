// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.NativeArray;

import static com.facebook.react.bridge.Arguments.*;

/**
 * Callback impl that calls directly into the cxx bridge. Created from C++.
 */
@DoNotStrip
public class CxxCallbackImpl implements Callback {
  @DoNotStrip
  private final HybridData mHybridData;

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
