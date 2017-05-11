// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

/**
 * This does nothing interesting, except avoid breaking existing code.
 */
@DoNotStrip
public class CxxModuleWrapper extends CxxModuleWrapperBase
{
  protected CxxModuleWrapper(HybridData hd) {
    super(hd);
  }

  private static native CxxModuleWrapper makeDsoNative(String soPath, String factory);

  public static CxxModuleWrapper makeDso(String library, String factory) {
    SoLoader.loadLibrary(library);
    String soPath = SoLoader.unpackLibraryAndDependencies(library).getAbsolutePath();
    return makeDsoNative(soPath, factory);
  }
}
