/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.react.bridge.RuntimeScheduler;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.fabric.events.EventEmitterWrapper;

public interface Binding {

  void startSurface(int surfaceId, @NonNull String moduleName, @NonNull NativeMap initialProps);

  void startSurfaceWithConstraints(
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

  void stopSurface(int surfaceId);

  void setPixelDensity(float pointScaleFactor);

  void setConstraints(
      int surfaceId,
      float minWidth,
      float maxWidth,
      float minHeight,
      float maxHeight,
      float offsetX,
      float offsetY,
      boolean isRTL,
      boolean doLeftAndRightSwapInRTL);

  void driveCxxAnimations();

  void reportMount(int surfaceId);

  ReadableNativeMap getInspectorDataForInstance(EventEmitterWrapper eventEmitterWrapper);

  void register(
      @NonNull RuntimeExecutor runtimeExecutor,
      @NonNull RuntimeScheduler runtimeScheduler,
      @NonNull FabricUIManager fabricUIManager,
      @NonNull EventBeatManager eventBeatManager,
      @NonNull ComponentFactory componentFactory,
      @NonNull ReactNativeConfig reactNativeConfig);

  void unregister();

  void registerSurface(SurfaceHandlerBinding surfaceHandler);

  void unregisterSurface(SurfaceHandlerBinding surfaceHandler);
}
