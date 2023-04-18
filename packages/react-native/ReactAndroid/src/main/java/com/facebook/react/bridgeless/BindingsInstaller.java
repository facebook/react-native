/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.proguard.annotations.DoNotStripAny;
import com.facebook.soloader.SoLoader;

@DoNotStripAny
public abstract class BindingsInstaller {
  static {
    SoLoader.loadLibrary("rninstance");
  }

  @DoNotStrip private final HybridData mHybridData;

  protected BindingsInstaller(HybridData hybridData) {
    mHybridData = hybridData;
  }
}
