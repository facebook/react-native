/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.jsi;

import android.annotation.SuppressLint;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.fabric.ReactNativeConfig;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.uimanager.PixelUtil;

@DoNotStrip
@SuppressLint("MissingNativeLoadLibrary")
public class Binding {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  private static native HybridData initHybrid();

  public Binding() {
    mHybridData = initHybrid();
  }

  private native void installFabricUIManager(
      long jsContextNativePointer,
      Object uiManager,
      EventBeatManager eventBeatManager,
      MessageQueueThread jsMessageQueueThread,
      ComponentFactoryDelegate componentsRegistry,
      Object reactNativeConfig);

  public native void startSurface(int surfaceId, NativeMap initialProps);

  public native void renderTemplateToSurface(int surfaceId, String uiTemplate);

  public native void stopSurface(int surfaceId);

  public native void setPixelDensity(float pointScaleFactor);

  public native void setConstraints(
      int rootTag, float minWidth, float maxWidth, float minHeight, float maxHeight);

  public void register(
       JavaScriptContextHolder jsContext,
       FabricUIManager fabricUIManager,
       EventBeatManager eventBeatManager,
       MessageQueueThread jsMessageQueueThread,
       ComponentFactoryDelegate componentFactoryDelegate,
       ReactNativeConfig reactNativeConfig) {
    fabricUIManager.setBinding(this);
     installFabricUIManager(
       jsContext.get(), fabricUIManager, eventBeatManager, jsMessageQueueThread, componentFactoryDelegate, reactNativeConfig);
     setPixelDensity(PixelUtil.getDisplayMetricDensity());
   }

  private native void uninstallFabricUIManager();

  public void unregister() {
    uninstallFabricUIManager();
  }
}
