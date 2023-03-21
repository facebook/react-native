/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import android.annotation.SuppressLint;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * This class holds reference to the C++ CppViewMutations object. Instances of this class are
 * created on the Bindings.cpp, where the pointer to the cppViewMutations is set.
 */
@SuppressLint("MissingNativeLoadLibrary")
public class CppViewMutationsWrapper {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  private static native HybridData initHybrid();

  private CppViewMutationsWrapper() {
    mHybridData = initHybrid();
  }

  public native void runCppViewMutations();

  public synchronized void destroy() {
    if (mHybridData != null) {
      mHybridData.resetNative();
    }
  }

  private boolean isValid() {
    if (mHybridData != null) {
      return mHybridData.isValid();
    }
    return false;
  }
}
