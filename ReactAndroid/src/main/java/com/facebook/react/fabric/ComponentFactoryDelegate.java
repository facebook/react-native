// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.fabric;

import androidx.annotation.Keep;
import com.facebook.jni.HybridData;

@Keep
public class ComponentFactoryDelegate {

  static {
    FabricSoLoader.staticInit();
  }

  @Keep private final HybridData mHybridData;

  @Keep
  private static native HybridData initHybrid();

  public ComponentFactoryDelegate() {
    mHybridData = initHybrid();
  }
}
