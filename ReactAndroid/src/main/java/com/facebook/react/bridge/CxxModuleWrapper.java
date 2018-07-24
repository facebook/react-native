// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
