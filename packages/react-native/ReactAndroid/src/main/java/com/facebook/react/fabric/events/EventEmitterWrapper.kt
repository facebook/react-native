/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events

import android.annotation.SuppressLint
import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.fabric.FabricSoLoader.staticInit
import com.facebook.react.uimanager.events.EventCategoryDef

/**
 * This class holds reference to the C++ EventEmitter object. Instances of this class are created in
 * FabricMountingManager.cpp, where the pointer to the C++ event emitter is set.
 */
@DoNotStripAny
@SuppressLint("MissingNativeLoadLibrary")
public class EventEmitterWrapper private constructor() : HybridClassBase() {
  private external fun dispatchEvent(
      eventName: String,
      params: NativeMap?,
      @EventCategoryDef category: Int
  )

  private external fun dispatchEventSynchronously(eventName: String, params: NativeMap?)

  private external fun dispatchUniqueEvent(eventName: String, params: NativeMap?)

  /**
   * Invokes the execution of the C++ EventEmitter.
   *
   * @param eventName [String] name of the event to execute.
   * @param params [WritableMap] payload of the event
   */
  @Synchronized
  public fun dispatch(
      eventName: String,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int
  ) {
    if (!isValid) {
      return
    }
    dispatchEvent(eventName, params as NativeMap?, eventCategory)
  }

  @Synchronized
  public fun dispatchEventSynchronously(eventName: String, params: WritableMap?) {
    if (!isValid) {
      return
    }
    dispatchEventSynchronously(eventName, params as NativeMap?)
  }

  /**
   * Invokes the execution of the C++ EventEmitter. C++ will coalesce events sent to the same
   * target.
   *
   * @param eventName [String] name of the event to execute.
   * @param params [WritableMap] payload of the event
   */
  @Synchronized
  public fun dispatchUnique(eventName: String, params: WritableMap?) {
    if (!isValid) {
      return
    }
    dispatchUniqueEvent(eventName, params as NativeMap?)
  }

  @Synchronized
  public fun destroy() {
    if (isValid) {
      resetNative()
    }
  }

  private companion object {
    init {
      staticInit()
    }
  }
}
