/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.RuntimeScheduler
import com.facebook.react.fabric.events.EventBeatManager
import com.facebook.react.fabric.events.EventEmitterWrapper

public interface Binding {
  public fun startSurface(surfaceId: Int, moduleName: String, initialProps: NativeMap)

  public fun startSurfaceWithConstraints(
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

  public fun stopSurface(surfaceId: Int)

  public fun setPixelDensity(pointScaleFactor: Float)

  public fun setConstraints(
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

  public fun driveCxxAnimations()

  public fun drainPreallocateViewsQueue()

  public fun reportMount(surfaceId: Int)

  public fun getInspectorDataForInstance(
      eventEmitterWrapper: EventEmitterWrapper?
  ): ReadableNativeMap?

  public fun register(
      runtimeExecutor: RuntimeExecutor,
      runtimeScheduler: RuntimeScheduler,
      fabricUIManager: FabricUIManager,
      eventBeatManager: EventBeatManager,
      componentFactory: ComponentFactory,
      reactNativeConfig: ReactNativeConfig
  )

  public fun unregister()

  public fun registerSurface(surfaceHandler: SurfaceHandlerBinding)

  public fun unregisterSurface(surfaceHandler: SurfaceHandlerBinding)
}
