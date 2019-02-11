// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.fabric.jsi;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class ComponentRegistry {

  static {
    FabricSoLoader.staticInit();
  }

  private final HybridData mHybridData;

  @DoNotStrip
  private static native HybridData initHybrid();

  public ComponentRegistry() {
    mHybridData = initHybrid();
  }

}
