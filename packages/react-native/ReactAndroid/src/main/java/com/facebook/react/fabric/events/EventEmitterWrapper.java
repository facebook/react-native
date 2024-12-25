/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events;

import android.annotation.SuppressLint;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.jni.HybridClassBase;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.fabric.FabricSoLoader;
import com.facebook.react.uimanager.events.EventCategoryDef;

/**
 * This class holds reference to the C++ EventEmitter object. Instances of this class are created in
 * FabricMountingManager.cpp, where the pointer to the C++ event emitter is set.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@DoNotStrip
@SuppressLint("MissingNativeLoadLibrary")
public class EventEmitterWrapper extends HybridClassBase {
  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip
  private EventEmitterWrapper() {}

  private native void dispatchEvent(
      String eventName, @Nullable NativeMap params, @EventCategoryDef int category);

  private native void dispatchEventSynchronously(String eventName, @Nullable NativeMap params);

  private native void dispatchUniqueEvent(String eventName, @Nullable NativeMap params);

  /**
   * Invokes the execution of the C++ EventEmitter.
   *
   * @param eventName {@link String} name of the event to execute.
   * @param params {@link WritableMap} payload of the event
   */
  public synchronized void dispatch(
      String eventName, @Nullable WritableMap params, @EventCategoryDef int eventCategory) {
    if (!isValid()) {
      return;
    }
    dispatchEvent(eventName, (NativeMap) params, eventCategory);
  }

  public synchronized void dispatchEventSynchronously(
      String eventName, @Nullable WritableMap params) {
    if (!isValid()) {
      return;
    }
    dispatchEventSynchronously(eventName, (NativeMap) params);
  }

  /**
   * Invokes the execution of the C++ EventEmitter. C++ will coalesce events sent to the same
   * target.
   *
   * @param eventName {@link String} name of the event to execute.
   * @param params {@link WritableMap} payload of the event
   */
  public synchronized void dispatchUnique(String eventName, @Nullable WritableMap params) {
    if (!isValid()) {
      return;
    }
    dispatchUniqueEvent(eventName, (NativeMap) params);
  }

  public synchronized void destroy() {
    if (isValid()) {
      resetNative();
    }
  }
}
