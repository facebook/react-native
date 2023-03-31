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
import com.facebook.jni.HybridData;
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
@SuppressLint("MissingNativeLoadLibrary")
@DoNotStrip
public class StateWrapperImpl implements StateWrapper {
  static {
    FabricSoLoader.staticInit();
  }

  private static final String TAG = "StateWrapperImpl";

  @DoNotStrip private final HybridData mHybridData;
  private volatile boolean mDestroyed = false;

  private StateWrapperImpl() {
    mHybridData = initHybrid();
  }

  private static native HybridData initHybrid();

  private native ReadableNativeMap getStateDataImpl();

  private native ReadableMapBuffer getStateMapBufferDataImpl();

  public native void updateStateImpl(@NonNull NativeMap map);

  @Override
  @Nullable
  public ReadableMapBuffer getStateDataMapBuffer() {
    if (mDestroyed) {
      FLog.e(TAG, "Race between StateWrapperImpl destruction and getState");
      return null;
    }
    return getStateMapBufferDataImpl();
  }

  @Override
  @Nullable
  public ReadableNativeMap getStateData() {
    if (mDestroyed) {
      FLog.e(TAG, "Race between StateWrapperImpl destruction and getState");
      return null;
    }
    return getStateDataImpl();
  }

  @Override
  public void updateState(@NonNull WritableMap map) {
    if (mDestroyed) {
      FLog.e(TAG, "Race between StateWrapperImpl destruction and updateState");
      return;
    }
    updateStateImpl((NativeMap) map);
  }

  @Override
  public void destroyState() {
    if (!mDestroyed) {
      mDestroyed = true;
      mHybridData.resetNative();
    }
  }
}
