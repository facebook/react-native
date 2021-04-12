/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getMaxSize;
import static com.facebook.react.fabric.mounting.LayoutMetricsConversions.getMinSize;

import androidx.annotation.IntDef;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeMap;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

public class SurfaceHandlerBinding implements SurfaceHandler {
  static {
    FabricSoLoader.staticInit();
  }

  private static final int NO_SURFACE_ID = 0;

  /* Keep in sync with SurfaceHandler.cpp */
  public static final int DISPLAY_MODE_VISIBLE = 0;
  public static final int DISPLAY_MODE_SUSPENDED = 1;
  public static final int DISPLAY_MODE_HIDDEN = 2;

  @Retention(RetentionPolicy.SOURCE)
  @IntDef({DISPLAY_MODE_VISIBLE, DISPLAY_MODE_SUSPENDED, DISPLAY_MODE_HIDDEN})
  public @interface DisplayModeTypeDef {}

  @DoNotStrip private final HybridData mHybridData;

  private static native HybridData initHybrid(int surfaceId, String moduleName);

  public SurfaceHandlerBinding(String moduleName) {
    mHybridData = initHybrid(NO_SURFACE_ID, moduleName);
  }

  @Override
  public int getSurfaceId() {
    return getSurfaceIdNative();
  }

  private native int getSurfaceIdNative();

  @Override
  public void setSurfaceId(int surfaceId) {
    setSurfaceIdNative(surfaceId);
  }

  private native void setSurfaceIdNative(int surfaceId);

  @Override
  public String getModuleName() {
    return getModuleNameNative();
  }

  private native String getModuleNameNative();

  @Override
  public void start() {
    startNative();
  }

  private native void startNative();

  @Override
  public void stop() {
    stopNative();
  }

  private native void stopNative();

  @Override
  public boolean isRunning() {
    return isRunningNative();
  }

  private native boolean isRunningNative();

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
  public void setProps(NativeMap props) {
    setPropsNative(props);
  }

  private native void setPropsNative(NativeMap props);

  @Override
  public void setMountable(boolean mountable) {
    setDisplayModeNative(mountable ? DISPLAY_MODE_VISIBLE : DISPLAY_MODE_SUSPENDED);
  }

  private native void setDisplayModeNative(@DisplayModeTypeDef int mode);
}
