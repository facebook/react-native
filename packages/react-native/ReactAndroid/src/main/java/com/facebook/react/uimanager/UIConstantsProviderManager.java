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
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.soloader.SoLoader;
import javax.annotation.Nullable;

@DoNotStripAny
public class UIConstantsProviderManager {

  static {
    staticInit();
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  public UIConstantsProviderManager(
      RuntimeExecutor runtimeExecutor,
      DefaultEventTypesProvider defaultEventTypesProvider,
      ConstantsForViewManagerProvider viewManagerConstantsProvider,
      ConstantsProvider constantsProvider) {
    mHybridData =
        initHybrid(
            runtimeExecutor,
            defaultEventTypesProvider,
            viewManagerConstantsProvider,
            constantsProvider);
    installJSIBindings();
  }

  private native HybridData initHybrid(
      RuntimeExecutor runtimeExecutor,
      DefaultEventTypesProvider defaultEventTypesProvider,
      ConstantsForViewManagerProvider viewManagerConstantsProvider,
      ConstantsProvider constantsProvider);

  private native void installJSIBindings();

  private static void staticInit() {
    SoLoader.loadLibrary("uimanagerjni");
  }

  @DoNotStripAny
  public static interface DefaultEventTypesProvider {
    /* Returns UIManager's constants. */
    NativeMap getDefaultEventTypes();
  }

  @DoNotStripAny
  public static interface ConstantsForViewManagerProvider {
    /* Returns UIManager's constants. */
    @Nullable
    NativeMap getConstantsForViewManager(String viewManagerName);
  }

  @DoNotStripAny
  public static interface ConstantsProvider {
    /* Returns UIManager's constants. */
    NativeMap getConstants();
  }
}
