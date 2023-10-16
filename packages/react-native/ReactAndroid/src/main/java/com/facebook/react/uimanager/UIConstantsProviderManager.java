/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.proguard.annotations.DoNotStripAny;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.soloader.SoLoader;

@DoNotStripAny
public class UIConstantsProviderManager {

  static {
    staticInit();
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  public UIConstantsProviderManager(
      RuntimeExecutor runtimeExecutor, Object uiConstantsProviderManager) {
    mHybridData = initHybrid(runtimeExecutor, uiConstantsProviderManager);
    installJSIBindings();
  }

  private native HybridData initHybrid(
      RuntimeExecutor runtimeExecutor, Object uiConstantsProviderManager);

  private native void installJSIBindings();

  private static void staticInit() {
    SoLoader.loadLibrary("uimanagerjni");
  }
}
