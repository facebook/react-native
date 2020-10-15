/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class ComponentFactory {

  static {
    FabricSoLoader.staticInit();
  }

  @NonNull @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private static native HybridData initHybrid();

  @DoNotStrip
  public ComponentFactory() {
    mHybridData = initHybrid();
  }
}
