// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.fabric.jsi;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;
import com.facebook.react.fabric.jsi.FabricSoLoader;

@DoNotStrip
public class ComponentFactoryDelegate {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip
  private final HybridData mHybridData;

  @DoNotStrip
  private static native HybridData initHybrid();

  public ComponentFactoryDelegate() {
    mHybridData = initHybrid();
  }

}
