/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@Nullsafe(Nullsafe.Mode.LOCAL)
public abstract class JSRuntimeFactory {
  static {
    SoLoader.loadLibrary("rninstance");
  }

  @DoNotStrip private final HybridData mHybridData;

  protected JSRuntimeFactory(HybridData hybridData) {
    mHybridData = hybridData;
  }
}
