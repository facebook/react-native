/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.jsi;

import android.annotation.SuppressLint;
import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.fabric.jsi.FabricSoLoader;

/**
 * This class holds reference to the C++ EventEmitter object. Instances of this class are created on
 * the Bindings.cpp, where the pointer to the C++ event emitter is set.
 */
@SuppressLint("MissingNativeLoadLibrary")
public class EventEmitterWrapper {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  private static native HybridData initHybrid();

  private EventEmitterWrapper() {
    mHybridData = initHybrid();
  }

  private native void invokeEvent(String eventName, NativeMap params);

  /**
   * Invokes the execution of the C++ EventEmitter.
   *
   * @param eventName {@link String} name of the event to execute.
   * @param params {@link WritableMap} payload of the event
   */
  public void invoke(String eventName, @Nullable WritableMap params) {
    NativeMap payload = params == null ? new WritableNativeMap() : (NativeMap) params;
    invokeEvent(eventName, payload);
  }
}
