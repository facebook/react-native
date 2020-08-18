/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.app.Activity;
import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSIModule;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;

/**
 * Wraps {@link ReactContext} with the base {@link Context} passed into the constructor. It provides
 * also a way to start activities using the viewContext to which RN native views belong. It
 * delegates lifecycle listener registration to the original instance of {@link ReactContext} which
 * is supposed to receive the lifecycle events. At the same time we disallow receiving lifecycle
 * events for this wrapper instances. TODO: T7538544 Rename ThemedReactContext to be in alignment
 * with name of ReactApplicationContext
 */
public class ThemedReactContext extends ReactContext {

  private final ReactApplicationContext mReactApplicationContext;
  @Nullable private final String mSurfaceID;

  public ThemedReactContext(ReactApplicationContext reactApplicationContext, Context base) {
    this(reactApplicationContext, base, null);
  }

  public ThemedReactContext(
      ReactApplicationContext reactApplicationContext, Context base, @Nullable String surfaceID) {
    super(base);
    if (reactApplicationContext.hasCatalystInstance()) {
      initializeWithInstance(reactApplicationContext.getCatalystInstance());
    }
    mReactApplicationContext = reactApplicationContext;
    mSurfaceID = surfaceID;
  }

  @Override
  public void addLifecycleEventListener(LifecycleEventListener listener) {
    mReactApplicationContext.addLifecycleEventListener(listener);
  }

  @Override
  public void removeLifecycleEventListener(LifecycleEventListener listener) {
    mReactApplicationContext.removeLifecycleEventListener(listener);
  }

  @Override
  public boolean hasCurrentActivity() {
    return mReactApplicationContext.hasCurrentActivity();
  }

  @Override
  public @Nullable Activity getCurrentActivity() {
    return mReactApplicationContext.getCurrentActivity();
  }

  /**
   * @return a {@link String} that represents the ID of the js application that is being rendered
   *     with this {@link ThemedReactContext}
   */
  public @Nullable String getSurfaceID() {
    return mSurfaceID;
  }

  public ReactApplicationContext getReactApplicationContext() {
    return mReactApplicationContext;
  }

  @Override
  public boolean isBridgeless() {
    return mReactApplicationContext.isBridgeless();
  }

  @Override
  public JSIModule getJSIModule(JSIModuleType moduleType) {
    if (isBridgeless()) {
      return mReactApplicationContext.getJSIModule(moduleType);
    }
    return super.getJSIModule(moduleType);
  }
}
