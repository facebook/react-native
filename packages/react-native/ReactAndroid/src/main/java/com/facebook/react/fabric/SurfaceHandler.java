/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import com.facebook.react.bridge.NativeMap;
import javax.annotation.concurrent.ThreadSafe;

/** Represents a Java variant of the surface, its status and inner data required to display it. */
@ThreadSafe
public interface SurfaceHandler {

  /** Starts the surface if the surface is not running */
  void start();

  /** Stops the surface if it is currently running */
  void stop();

  void setProps(NativeMap props);

  /**
   * Provides current surface id. Id should be updated after each call to {@link
   * SurfaceHandler#stop}
   */
  int getSurfaceId();

  /**
   * Updates current surface id. Id should be updated after each call to {@link SurfaceHandler#stop}
   */
  void setSurfaceId(int surfaceId);

  boolean isRunning();

  String getModuleName();

  void setLayoutConstraints(
      int widthMeasureSpec,
      int heightMeasureSpec,
      int offsetX,
      int offsetY,
      boolean doLeftAndRightSwapInRTL,
      boolean isRTL,
      float pixelDensity);

  void setMountable(boolean mountable);
}
