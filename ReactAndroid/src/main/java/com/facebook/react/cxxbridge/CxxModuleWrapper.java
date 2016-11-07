// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.cxxbridge;

import java.util.Map;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ExecutorToken;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.soloader.SoLoader;

/**
 * A Java Object which represents a cross-platform C++ module
 *
 */
@DoNotStrip
public class CxxModuleWrapper implements NativeModule
{
  static {
    SoLoader.loadLibrary(CatalystInstanceImpl.REACT_NATIVE_LIB);
  }

  @DoNotStrip
  private HybridData mHybridData;

  @DoNotStrip
  private static class MethodWrapper implements NativeMethod
  {
    @DoNotStrip
    HybridData mHybridData;

    MethodWrapper() {
      mHybridData = initHybrid();
    }

    public native HybridData initHybrid();

    @Override
    public native void invoke(
        CatalystInstance catalystInstance,
        ExecutorToken executorToken,
        ReadableNativeArray args);

    @Override
    public native String getType();
  }

  public CxxModuleWrapper(String library, String factory) {
    SoLoader.loadLibrary(library);
    mHybridData =
      initHybrid(SoLoader.unpackLibraryAndDependencies(library).getAbsolutePath(), factory);
  }

  @Override
  public native String getName();

  @Override
  public native Map<String, NativeMethod> getMethods();

  public native String getConstantsJson();

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
  protected CxxModuleWrapper(HybridData hd) {
    mHybridData = hd;
  }

  private native HybridData initHybrid(String soPath, String factory);
}
