/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events;

import android.annotation.SuppressLint;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.fabric.FabricSoLoader;
import com.facebook.react.uimanager.events.EventCategoryDef;

/**
 * This class holds reference to the C++ EventEmitter object. Instances of this class are created in
 * FabricMountingManager.cpp, where the pointer to the C++ event emitter is set.
 */
@DoNotStrip
@SuppressLint("MissingNativeLoadLibrary")
public class EventEmitterWrapper {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private EventEmitterWrapper(HybridData hybridData) {
    mHybridData = hybridData;
  }

  private native void dispatchEvent(
      @NonNull String eventName, @NonNull NativeMap params, @EventCategoryDef int category);

  private native void dispatchUniqueEvent(@NonNull String eventName, @NonNull NativeMap params);

  /**
   * Invokes the execution of the C++ EventEmitter.
   *
   * @param eventName {@link String} name of the event to execute.
   * @param params {@link WritableMap} payload of the event
   */
  public synchronized void dispatch(
      @NonNull String eventName,
      @Nullable WritableMap params,
      @EventCategoryDef int eventCategory) {
    if (!isValid()) {
      return;
    }
    dispatchEvent(eventName, (NativeMap) params, eventCategory);
  }

  /**
   * Invokes the execution of the C++ EventEmitter. C++ will coalesce events sent to the same
   * target.
   *
   * @param eventName {@link String} name of the event to execute.
   * @param params {@link WritableMap} payload of the event
   */
  public synchronized void dispatchUnique(@NonNull String eventName, @Nullable WritableMap params) {
    if (!isValid()) {
      return;
    }
    dispatchUniqueEvent(eventName, (NativeMap) params);
  }

  public synchronized void destroy() {
    if (mHybridData != null) {
      mHybridData.resetNative();
    }
  }

  private boolean isValid() {
    if (mHybridData != null) {
      return mHybridData.isValid();
    }
    return false;
  }
}
