/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import android.annotation.SuppressLint;
import androidx.annotation.AnyThread;
import androidx.annotation.NonNull;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.UiThreadUtil;
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

  private Runnable mFailureCallback = null;
  private int mUpdateStateId = 0;

  private static native HybridData initHybrid();

  private StateWrapperImpl() {
    mHybridData = initHybrid();
  }

  @Override
  public native ReadableNativeMap getState();

  public native void updateStateImpl(@NonNull NativeMap map);

  public native void updateStateWithFailureCallbackImpl(
      @NonNull NativeMap map, Object self, int updateStateId);

  @Override
  public void updateState(@NonNull WritableMap map, Runnable failureCallback) {
    mUpdateStateId++;
    mFailureCallback = failureCallback;
    updateStateWithFailureCallbackImpl((NativeMap) map, this, mUpdateStateId);
  }

  @DoNotStrip
  @AnyThread
  public void updateStateFailed(int callbackRefId) {
    // If the callback ref ID doesn't match the ID of the most-recent updateState call,
    // then it's an outdated failure callback and we ignore it.
    if (callbackRefId != mUpdateStateId) {
      return;
    }

    final Runnable failureCallback = mFailureCallback;
    mFailureCallback = null;
    if (failureCallback != null) {
      UiThreadUtil.runOnUiThread(failureCallback);
    }
  }
}
