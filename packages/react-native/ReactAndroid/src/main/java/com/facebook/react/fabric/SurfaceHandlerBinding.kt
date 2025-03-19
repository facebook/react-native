/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.jni.HybridClassBase
import com.facebook.react.bridge.NativeMap
import com.facebook.react.fabric.mounting.LayoutMetricsConversions
import com.facebook.react.interfaces.fabric.SurfaceHandler

internal open class SurfaceHandlerBinding(moduleName: String) : HybridClassBase(), SurfaceHandler {

  init {
    initHybrid(NO_SURFACE_ID, moduleName)
  }

  private external fun initHybrid(surfaceId: Int, moduleName: String)

  override val surfaceId: Int
    get() = _getSurfaceId()

  override val isRunning: Boolean
    get() = _isRunning()

  override val moduleName: String
    get() = _getModuleName()

  private external fun _getSurfaceId(): Int

  private external fun _getModuleName(): String

  private external fun _isRunning(): Boolean

  override fun setLayoutConstraints(
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
      offsetX: Int,
      offsetY: Int,
      doLeftAndRightSwapInRTL: Boolean,
      isRTL: Boolean,
      pixelDensity: Float
  ) {
    setLayoutConstraintsNative(
        LayoutMetricsConversions.getMinSize(widthMeasureSpec) / pixelDensity,
        LayoutMetricsConversions.getMaxSize(widthMeasureSpec) / pixelDensity,
        LayoutMetricsConversions.getMinSize(heightMeasureSpec) / pixelDensity,
        LayoutMetricsConversions.getMaxSize(heightMeasureSpec) / pixelDensity,
        offsetX / pixelDensity,
        offsetY / pixelDensity,
        doLeftAndRightSwapInRTL,
        isRTL,
        pixelDensity)
  }

  private external fun setLayoutConstraintsNative(
      minWidth: Float,
      maxWidth: Float,
      minHeight: Float,
      maxHeight: Float,
      offsetX: Float,
      offsetY: Float,
      doLeftAndRightSwapInRTL: Boolean,
      isRTL: Boolean,
      pixelDensity: Float
  )

  external override fun setProps(props: NativeMap)

  override fun setMountable(mountable: Boolean) {
    setDisplayMode(if (mountable) DISPLAY_MODE_VISIBLE else DISPLAY_MODE_SUSPENDED)
  }

  private external fun setDisplayMode(mode: Int)

  private companion object {
    private const val NO_SURFACE_ID = 0

    // Keep in sync with SurfaceHandler.cpp
    const val DISPLAY_MODE_VISIBLE = 0
    const val DISPLAY_MODE_SUSPENDED = 1
    const val DISPLAY_MODE_HIDDEN = 2

    init {
      FabricSoLoader.staticInit()
    }
  }
}
