/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core;

import com.facebook.jni.HybridData;
import com.facebook.react.turbomodule.core.interfaces.NativeMethodCallInvokerHolder;
import com.facebook.soloader.SoLoader;

/**
 * NativeMethodCallInvokerHolder is created at a different time/place (i.e: in CatalystInstance)
 * than TurboModuleManager. Therefore, we need to wrap NativeMethodCallInvokerHolder within a hybrid
 * class so that we may pass it from CatalystInstance, through Java, to
 * TurboModuleManager::initHybrid.
 */
public class NativeMethodCallInvokerHolderImpl implements NativeMethodCallInvokerHolder {
  private static volatile boolean sIsSoLibraryLoaded;

  private final HybridData mHybridData;

  private NativeMethodCallInvokerHolderImpl(HybridData hd) {
    maybeLoadSoLibrary();
    mHybridData = hd;
  }

  // Prevents issues with initializer interruptions. See T38996825 and D13793825 for more context.
  private static synchronized void maybeLoadSoLibrary() {
    if (!sIsSoLibraryLoaded) {
      SoLoader.loadLibrary("turbomodulejsijni");
      sIsSoLibraryLoaded = true;
    }
  }
}
