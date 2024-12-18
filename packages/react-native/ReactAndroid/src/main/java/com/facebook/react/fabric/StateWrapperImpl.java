/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import android.annotation.SuppressLint;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.jni.HybridClassBase;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.mapbuffer.ReadableMapBuffer;
import com.facebook.react.uimanager.StateWrapper;

/**
 * This class holds reference to the C++ EventEmitter object. Instances of this class are created on
 * the Bindings.cpp, where the pointer to the C++ event emitter is set.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@SuppressLint("MissingNativeLoadLibrary")
@DoNotStrip
public class StateWrapperImpl extends HybridClassBase implements StateWrapper {
  static {
    FabricSoLoader.staticInit();
  }

  private static final String TAG = "StateWrapperImpl";

  private StateWrapperImpl() {
    initHybrid();
  }

  private native void initHybrid();

  private native ReadableNativeMap getStateDataImpl();

  private native ReadableMapBuffer getStateMapBufferDataImpl();

  public native void updateStateImpl(@NonNull NativeMap map);

  @Override
  @Nullable
  public ReadableMapBuffer getStateDataMapBuffer() {
    if (!isValid()) {
      FLog.e(TAG, "Race between StateWrapperImpl destruction and getState");
      return null;
    }
    return getStateMapBufferDataImpl();
  }

  @Override
  @Nullable
  public ReadableNativeMap getStateData() {
    if (!isValid()) {
      FLog.e(TAG, "Race between StateWrapperImpl destruction and getState");
      return null;
    }
    return getStateDataImpl();
  }

  @Override
  public void updateState(@NonNull WritableMap map) {
    if (!isValid()) {
      FLog.e(TAG, "Race between StateWrapperImpl destruction and updateState");
      return;
    }
    updateStateImpl((NativeMap) map);
  }

  @Override
  public void destroyState() {
    if (isValid()) {
      resetNative();
    }
  }

  @Override
  public String toString() {
    if (!isValid()) {
      return "<destroyed>";
    }

    ReadableMapBuffer mapBuffer = getStateMapBufferDataImpl();
    if (mapBuffer != null) {
      return mapBuffer.toString();
    }

    ReadableNativeMap map = getStateDataImpl();
    if (map == null) {
      return "<unexpected null>";
    }

    return map.toString();
  }
}
