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
  static {
    SoLoader.loadLibrary("turbomodulejsijni");
  }

  private final HybridData mHybridData;

  protected abstract HybridData initHybrid();

  protected TurboModuleManagerDelegate() {
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
}
