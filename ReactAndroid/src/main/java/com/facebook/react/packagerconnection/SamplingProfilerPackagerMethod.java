/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.packagerconnection;

import javax.annotation.Nullable;

import android.os.Looper;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

public class SamplingProfilerPackagerMethod extends RequestOnlyHandler {
  static {
    SoLoader.loadLibrary("packagerconnectionjnifb");
  }

  final private static class SamplingProfilerJniMethod {

    @DoNotStrip
    private final HybridData mHybridData;

    public SamplingProfilerJniMethod(long javaScriptContext) {
      if (Looper.myLooper() == null) {
        Looper.prepare();
      }

      mHybridData = initHybrid(javaScriptContext);
    }

    @DoNotStrip
    private native void poke(Responder responder);

    @DoNotStrip
    private static native HybridData initHybrid(long javaScriptContext);
  }

  private SamplingProfilerJniMethod mJniMethod;

  public SamplingProfilerPackagerMethod(long javaScriptContext) {
    mJniMethod = new SamplingProfilerJniMethod(javaScriptContext);
  }

  @Override
  public void onRequest(@Nullable Object params, Responder responder) {
    mJniMethod.poke(responder);
  }
}
