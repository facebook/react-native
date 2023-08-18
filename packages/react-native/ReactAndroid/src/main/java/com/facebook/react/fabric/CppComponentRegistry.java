/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class CppComponentRegistry {

  static {
    FabricSoLoader.staticInit();
  }

  @NonNull private final HybridData mHybridData;

  private static native HybridData initHybrid();

  private CppComponentRegistry(HybridData hybridData) {
    mHybridData = hybridData;
  }
}
