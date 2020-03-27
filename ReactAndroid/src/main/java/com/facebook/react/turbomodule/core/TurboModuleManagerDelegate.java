/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core;

import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.react.bridge.CxxModuleWrapper;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.soloader.SoLoader;
import java.util.ArrayList;
import java.util.List;

public abstract class TurboModuleManagerDelegate {
  private final HybridData mHybridData;

  private static volatile boolean sIsSoLibraryLoaded;

  protected abstract HybridData initHybrid();

  protected TurboModuleManagerDelegate() {
    maybeLoadOtherSoLibraries();
    maybeLoadSoLibrary();
    mHybridData = initHybrid();
  }

  /**
   * Create and return a TurboModule Java object with name `moduleName`. If `moduleName` isn't a
   * TurboModule, return null.
   */
  @Nullable
  public abstract TurboModule getModule(String moduleName);

  /**
   * Create an return a CxxModuleWrapper NativeModule with name `moduleName`. If `moduleName` isn't
   * a CxxModule, return null.
   */
  @Nullable
  public abstract CxxModuleWrapper getLegacyCxxModule(String moduleName);

  public List<String> getEagerInitModuleNames() {
    return new ArrayList<>();
  }

  // Prevents issues with initializer interruptions. See T38996825 and D13793825 for more context.
  private static synchronized void maybeLoadSoLibrary() {
    if (!sIsSoLibraryLoaded) {
      SoLoader.loadLibrary("turbomodulejsijni");
      sIsSoLibraryLoaded = true;
    }
  }

  protected synchronized void maybeLoadOtherSoLibraries() {}
}
