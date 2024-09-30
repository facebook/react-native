/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getMaxSize;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getMinSize;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.jni.HybridClassBase;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.interfaces.fabric.SurfaceHandler;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class SurfaceHandlerBinding extends HybridClassBase implements SurfaceHandler {
  static {
    FabricSoLoader.staticInit();
  }

  private static final int NO_SURFACE_ID = 0;

  /* Keep in sync with SurfaceHandler.cpp */
  public static final int DISPLAY_MODE_VISIBLE = 0;
  public static final int DISPLAY_MODE_SUSPENDED = 1;
  public static final int DISPLAY_MODE_HIDDEN = 2;

  private native void initHybrid(int surfaceId, String moduleName);

  public SurfaceHandlerBinding(String moduleName) {
    initHybrid(NO_SURFACE_ID, moduleName);
  }

  @Override
  public native int getSurfaceId();

  @Override
  public native String getModuleName();

  @Override
  public native boolean isRunning();

  @Override
  public void setLayoutConstraints(
      int widthMeasureSpec,
      int heightMeasureSpec,
      int offsetX,
      int offsetY,
      boolean doLeftAndRightSwapInRTL,
      boolean isRTL,
      float pixelDensity) {
    setLayoutConstraintsNative(
        getMinSize(widthMeasureSpec) / pixelDensity,
        getMaxSize(widthMeasureSpec) / pixelDensity,
        getMinSize(heightMeasureSpec) / pixelDensity,
        getMaxSize(heightMeasureSpec) / pixelDensity,
        offsetX / pixelDensity,
        offsetY / pixelDensity,
        doLeftAndRightSwapInRTL,
        isRTL,
        pixelDensity);
  }

  private native void setLayoutConstraintsNative(
      float minWidth,
      float maxWidth,
      float minHeight,
      float maxHeight,
      float offsetX,
      float offsetY,
      boolean doLeftAndRightSwapInRTL,
      boolean isRTL,
      float pixelDensity);

  @Override
  public native void setProps(NativeMap props);

  @Override
  public void setMountable(boolean mountable) {
    setDisplayMode(mountable ? DISPLAY_MODE_VISIBLE : DISPLAY_MODE_SUSPENDED);
  }

  private native void setDisplayMode(int mode);
}
