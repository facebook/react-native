/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.jsi;

import android.annotation.SuppressLint;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.StateWrapper;

/**
 * This class holds reference to the C++ EventEmitter object. Instances of this class are created on
 * the Bindings.cpp, where the pointer to the C++ event emitter is set.
 */
@SuppressLint("MissingNativeLoadLibrary")
public class StateWrapperImpl implements StateWrapper {
  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  private static native HybridData initHybrid();

  private StateWrapperImpl() {
    mHybridData = initHybrid();
  }

  @Override public native ReadableNativeMap getState();
  public native void updateStateImpl(NativeMap map);

  @Override public void updateState(WritableMap map) {
    updateStateImpl((NativeMap)map);
  }
}
