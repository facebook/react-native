/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtimescheduler;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.proguard.annotations.DoNotStripAny;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.soloader.SoLoader;

@DoNotStripAny
public class RuntimeSchedulerManager {

  static {
    staticInit();
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  public RuntimeSchedulerManager(RuntimeExecutor runtimeExecutor) {
    mHybridData = initHybrid(runtimeExecutor);
    installJSIBindings();
  }

  private native HybridData initHybrid(RuntimeExecutor runtimeExecutor);

  private native void installJSIBindings();

  private static void staticInit() {
    SoLoader.loadLibrary("runtimeschedulerjni");
  }
}
