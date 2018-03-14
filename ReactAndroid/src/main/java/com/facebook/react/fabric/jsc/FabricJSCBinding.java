// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.fabric.jsc;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.fabric.FabricBinding;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class FabricJSCBinding implements FabricBinding {

  static {
    SoLoader.loadLibrary("fabricjscjni");
  }

  // used from native
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  private static native HybridData initHybrid();

  private native void installFabric(long jsContextNativePointer, Object fabricModule);

  public FabricJSCBinding() {
    mHybridData = initHybrid();
  }

  @Override
  public void installFabric(JavaScriptContextHolder jsContext, FabricUIManager fabricModule) {
    installFabric(jsContext.get(), fabricModule);
  }
}
