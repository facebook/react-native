/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events;

import android.annotation.SuppressLint;
import androidx.annotation.NonNull;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.fabric.FabricSoLoader;
import com.facebook.react.uimanager.events.BatchEventDispatchedListener;

/**
 * Class that acts as a proxy between the list of EventBeats registered in C++ and the Android side.
 */
@SuppressLint("MissingNativeLoadLibrary")
public class EventBeatManager implements BatchEventDispatchedListener {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;
  private final ReactApplicationContext mReactApplicationContext;

  private static native HybridData initHybrid();

  private native void tick();

  public EventBeatManager(@NonNull ReactApplicationContext reactApplicationContext) {
    mHybridData = initHybrid();
    mReactApplicationContext = reactApplicationContext;
  }

  @Override
  public void onBatchEventDispatched() {
    tick();
  }
}
