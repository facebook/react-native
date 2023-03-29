/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import android.annotation.SuppressLint;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.react.bridge.RuntimeScheduler;
import com.facebook.react.common.mapbuffer.MapBufferSoLoader;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.uimanager.PixelUtil;

@DoNotStrip
@SuppressLint("MissingNativeLoadLibrary")
public class Binding {

  static {
    FabricSoLoader.staticInit();
    MapBufferSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  private static native HybridData initHybrid();

  public Binding() {
    mHybridData = initHybrid();
  }

  private native void installFabricUIManager(
      RuntimeExecutor runtimeExecutor,
      RuntimeScheduler runtimeScheduler,
      Object uiManager,
      EventBeatManager eventBeatManager,
      ComponentFactory componentsRegistry,
      Object reactNativeConfig);

  public native void startSurface(
      int surfaceId, @NonNull String moduleName, @NonNull NativeMap initialProps);

  public native void startSurfaceWithConstraints(
      int surfaceId,
      String moduleName,
      NativeMap initialProps,
      float minWidth,
      float maxWidth,
      float minHeight,
      float maxHeight,
      float offsetX,
      float offsetY,
      boolean isRTL,
      boolean doLeftAndRightSwapInRTL);

  public native void renderTemplateToSurface(int surfaceId, String uiTemplate);

  public native void stopSurface(int surfaceId);

  public native void setPixelDensity(float pointScaleFactor);

  public native void setConstraints(
      int surfaceId,
      float minWidth,
      float maxWidth,
      float minHeight,
      float maxHeight,
      float offsetX,
      float offsetY,
      boolean isRTL,
      boolean doLeftAndRightSwapInRTL);

  public native void driveCxxAnimations();

  public native ReadableNativeMap getInspectorDataForInstance(
      EventEmitterWrapper eventEmitterWrapper);

  public void register(
      @NonNull RuntimeExecutor runtimeExecutor,
      @Nullable RuntimeScheduler runtimeScheduler,
      @NonNull FabricUIManager fabricUIManager,
      @NonNull EventBeatManager eventBeatManager,
      @NonNull ComponentFactory componentFactory,
      @NonNull ReactNativeConfig reactNativeConfig) {
    fabricUIManager.setBinding(this);
    installFabricUIManager(
        runtimeExecutor,
        runtimeScheduler,
        fabricUIManager,
        eventBeatManager,
        componentFactory,
        reactNativeConfig);

    setPixelDensity(PixelUtil.getDisplayMetricDensity());
  }

  private native void uninstallFabricUIManager();

  public void unregister() {
    uninstallFabricUIManager();
  }

  public native void registerSurface(SurfaceHandlerBinding surfaceHandler);

  public native void unregisterSurface(SurfaceHandlerBinding surfaceHandler);
}
