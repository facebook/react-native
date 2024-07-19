/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events;

import android.annotation.SuppressLint;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.fabric.FabricSoLoader;
import com.facebook.react.uimanager.events.BatchEventDispatchedListener;

/**
 * Class that acts as a proxy between the list of EventBeats registered in C++ and the Android side.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@SuppressLint("MissingNativeLoadLibrary")
public final class EventBeatManager implements BatchEventDispatchedListener {

  static {
    FabricSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  private static native HybridData initHybrid();

  private native void tick();

  @Deprecated(forRemoval = true, since = "Deprecated on v0.72.0 Use EventBeatManager() instead")
  public EventBeatManager(ReactApplicationContext reactApplicationContext) {
    this();
  }

  public EventBeatManager() {
    mHybridData = initHybrid();
  }

  @Override
  public void onBatchEventDispatched() {
    tick();
  }
}
