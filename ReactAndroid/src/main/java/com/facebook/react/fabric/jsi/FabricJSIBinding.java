// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.fbreact.fabric.jsi;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.fabric.FabricBinder;
import com.facebook.react.fabric.FabricBinding;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class FabricJSIBinding implements FabricBinding {

  static {
    SoLoader.loadLibrary("fabricjsijni");
  }

  // used from native
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  private static native HybridData initHybrid();

  @Override
  public native void releaseEventTarget(long jsContextNativePointer, long eventTargetPointer);

  @Override
  public native void releaseEventHandler(long jsContextNativePointer, long eventHandlerPointer);

  @Override
  public native void dispatchEventToEmptyTarget(
      long jsContextNativePointer, long eventHandlerPointer, String type, NativeMap payload);

  @Override
  public native void dispatchEventToTarget(
      long jsContextNativePointer,
      long eventHandlerPointer,
      long eventTargetPointer,
      String type,
      NativeMap payload);

  private native void installFabric(long jsContextNativePointer, Object fabricModule);

  public FabricJSIBinding() {
    mHybridData = initHybrid();
  }

  @Override
  public void installFabric(JavaScriptContextHolder jsContext, FabricBinder fabricModule) {
    fabricModule.setBinding(this);
    installFabric(jsContext.get(), fabricModule);
  }
}
