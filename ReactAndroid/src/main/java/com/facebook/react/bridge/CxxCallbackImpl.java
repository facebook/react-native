// Copyright 2004-present Facebook. All Rights Reserved.

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
