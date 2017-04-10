// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.cxxbridge;

import java.util.Map;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeModule;
import com.facebook.soloader.SoLoader;

/**
 * A Java Object which represents a cross-platform C++ module
 *
 * This module implements the NativeModule interface but will never be invoked from Java,
 * instead the underlying Cxx module will be extracted by the bridge and called directly.
 */
@DoNotStrip
public class CxxModuleWrapperBase implements NativeModule
{
  static {
    SoLoader.loadLibrary(CatalystInstanceImpl.REACT_NATIVE_LIB);
  }

  @DoNotStrip
  private HybridData mHybridData;

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
  public boolean supportsWebWorkers() {
    return false;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mHybridData.resetNative();
  }

  // For creating a wrapper from C++, or from a derived class.
  protected CxxModuleWrapperBase(HybridData hd) {
    mHybridData = hd;
  }
}
