/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * A Java Object which represents a cross-platform C++ module
 *
 * <p>This module implements the NativeModule interface but will never be invoked from Java, instead
 * the underlying Cxx module will be extracted by the bridge and called directly.
 */
@DoNotStrip
public class CxxModuleWrapperBase implements NativeModule {
  static {
    ReactBridge.staticInit();
  }

  @DoNotStrip private HybridData mHybridData;

  @Override
  public native String getName();

  @Override
  public void initialize() {
    // do nothing
  }

  @Override
  public boolean canOverrideExistingModule() {
    return false;
  }

  @Override
  public void onCatalystInstanceDestroy() {}

  @Override
  public void invalidate() {
    mHybridData.resetNative();
  }

  // For creating a wrapper from C++, or from a derived class.
  protected CxxModuleWrapperBase(HybridData hd) {
    mHybridData = hd;
  }

  // Replace the current native module held by this wrapper by a new instance
  protected void resetModule(HybridData hd) {
    if (hd != mHybridData) {
      mHybridData.resetNative();
      mHybridData = hd;
    }
  }
}
