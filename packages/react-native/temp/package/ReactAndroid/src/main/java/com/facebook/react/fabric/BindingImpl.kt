/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import android.annotation.SuppressLint
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.RuntimeScheduler
import com.facebook.react.common.mapbuffer.MapBufferSoLoader
import com.facebook.react.fabric.events.EventBeatManager
import com.facebook.react.fabric.events.EventEmitterWrapper
import com.facebook.react.uimanager.PixelUtil.getDisplayMetricDensity

@DoNotStrip
@SuppressLint("MissingNativeLoadLibrary")
public class BindingImpl : Binding {
  @DoNotStrip @Suppress("NoHungarianNotation") private val mHybridData: HybridData = initHybrid()

  private external fun installFabricUIManager(
      runtimeExecutor: RuntimeExecutor,
      runtimeScheduler: RuntimeScheduler,
      uiManager: FabricUIManager,
      eventBeatManager: EventBeatManager,
      componentsRegistry: ComponentFactory,
      reactNativeConfig: Any
  )

  external override fun startSurface(surfaceId: Int, moduleName: String, initialProps: NativeMap)

  external override fun startSurfaceWithConstraints(
      surfaceId: Int,
      moduleName: String,
      initialProps: NativeMap,
      minWidth: Float,
      maxWidth: Float,
      minHeight: Float,
      maxHeight: Float,
      offsetX: Float,
      offsetY: Float,
      isRTL: Boolean,
      doLeftAndRightSwapInRTL: Boolean
  )

  external override fun stopSurface(surfaceId: Int)

  external override fun setPixelDensity(pointScaleFactor: Float)

  external override fun setConstraints(
      surfaceId: Int,
      minWidth: Float,
      maxWidth: Float,
      minHeight: Float,
      maxHeight: Float,
      offsetX: Float,
      offsetY: Float,
      isRTL: Boolean,
      doLeftAndRightSwapInRTL: Boolean
  )

  external override fun driveCxxAnimations()

  external override fun drainPreallocateViewsQueue()

  external override fun reportMount(surfaceId: Int)

  external override fun getInspectorDataForInstance(
      eventEmitterWrapper: EventEmitterWrapper?
  ): ReadableNativeMap?

  override fun register(
      runtimeExecutor: RuntimeExecutor,
      runtimeScheduler: RuntimeScheduler,
      fabricUIManager: FabricUIManager,
      eventBeatManager: EventBeatManager,
      componentFactory: ComponentFactory,
      reactNativeConfig: ReactNativeConfig
  ) {
    fabricUIManager.setBinding(this)
    installFabricUIManager(
        runtimeExecutor,
        runtimeScheduler,
        fabricUIManager,
        eventBeatManager,
        componentFactory,
        reactNativeConfig)
    setPixelDensity(getDisplayMetricDensity())
  }

  private external fun uninstallFabricUIManager()

  override fun unregister() {
    uninstallFabricUIManager()
  }

  external override fun registerSurface(surfaceHandler: SurfaceHandlerBinding)

  external override fun unregisterSurface(surfaceHandler: SurfaceHandlerBinding)

  private companion object {
    init {
      FabricSoLoader.staticInit()
      MapBufferSoLoader.staticInit()
    }

    @JvmStatic private external fun initHybrid(): HybridData
  }
}
