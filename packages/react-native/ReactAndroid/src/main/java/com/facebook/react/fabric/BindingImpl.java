/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import android.annotation.SuppressLint;
import androidx.annotation.NonNull;
import com.facebook.infer.annotation.Nullsafe;
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

@Nullsafe(Nullsafe.Mode.LOCAL)
@DoNotStrip
@SuppressLint("MissingNativeLoadLibrary")
public class BindingImpl implements Binding {

  static {
    FabricSoLoader.staticInit();
    MapBufferSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  private static native HybridData initHybrid();

  public BindingImpl() {
    mHybridData = initHybrid();
  }

  private native void installFabricUIManager(
      RuntimeExecutor runtimeExecutor,
      RuntimeScheduler runtimeScheduler,
      FabricUIManager uiManager,
      EventBeatManager eventBeatManager,
      ComponentFactory componentsRegistry,
      Object reactNativeConfig);

  @Override
  public native void startSurface(
      int surfaceId, @NonNull String moduleName, @NonNull NativeMap initialProps);

  @Override
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

  @Override
  public native void stopSurface(int surfaceId);

  @Override
  public native void setPixelDensity(float pointScaleFactor);

  @Override
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

  public native void reportMount(int surfaceId);

  public native ReadableNativeMap getInspectorDataForInstance(
      EventEmitterWrapper eventEmitterWrapper);

  public void register(
      @NonNull RuntimeExecutor runtimeExecutor,
      @NonNull RuntimeScheduler runtimeScheduler,
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
