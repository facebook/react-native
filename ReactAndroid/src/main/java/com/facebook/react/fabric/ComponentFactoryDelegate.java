// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.fabric;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class ComponentFactoryDelegate {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private static native HybridData initHybrid();

  public ComponentFactoryDelegate() {
    mHybridData = initHybrid();
  }
}
