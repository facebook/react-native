/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.jsc;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.fabric.FabricBinding;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.bridge.NativeMap;
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

  @Override
  public native void releaseEventTarget(long jsContextNativePointer, long eventTargetPointer);

  @Override
  public native void releaseEventHandler(long jsContextNativePointer, long eventHandlerPointer);

  @Override
  public native void dispatchEventToEmptyTarget(
    long jsContextNativePointer,
    long eventHandlerPointer,
    String type,
    NativeMap payload
  );

  @Override
  public native void dispatchEventToTarget(
    long jsContextNativePointer,
    long eventHandlerPointer,
    long eventTargetPointer,
    String type,
    NativeMap payload
  );

  private native void installFabric(long jsContextNativePointer, Object fabricModule);

  public FabricJSCBinding() {
    mHybridData = initHybrid();
  }

  @Override
  public void installFabric(JavaScriptContextHolder jsContext, FabricUIManager fabricModule) {
    fabricModule.setBinding(this);
    installFabric(jsContext.get(), fabricModule);
  }
}
