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
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.events.BatchEventDispatchedListener;
import com.facebook.react.fabric.jsi.FabricSoLoader;

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

  private static native HybridData initHybrid(long jsContext);

  private native void beat();

  public EventBeatManager(
      JavaScriptContextHolder jsContext, ReactApplicationContext reactApplicationContext) {
    mHybridData = initHybrid(jsContext.get());
    mReactApplicationContext = reactApplicationContext;
  }

  @Override
  public void onBatchEventDispatched() {
    dispatchEventsAsync();
  }

  /**
   * Induce a beat in the AsyncEventBeat, calling the JNI method {@link #beat()} in the JS thread.
   */
  private void dispatchEventsAsync() {
    if (mReactApplicationContext.isOnJSQueueThread()) {
      beat();
    } else {
      mReactApplicationContext.runOnJSQueueThread(
          new Runnable() {
            @Override
            public void run() {
              beat();
            }
          });
    }
  }
}
