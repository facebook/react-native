/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import androidx.annotation.Nullable;
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
  @Nullable private final String mModuleName;
  private final int mSurfaceId;

  @Deprecated
  public ThemedReactContext(ReactApplicationContext reactApplicationContext, Context base) {
    this(reactApplicationContext, base, null, -1);
  }

  @Deprecated
  public ThemedReactContext(
      ReactApplicationContext reactApplicationContext, Context base, @Nullable String moduleName) {
    this(reactApplicationContext, base, moduleName, -1);
  }

  public ThemedReactContext(
      ReactApplicationContext reactApplicationContext,
      Context base,
      @Nullable String moduleName,
      int surfaceId) {
    super(reactApplicationContext, base);
    mReactApplicationContext = reactApplicationContext;
    mModuleName = moduleName;
    mSurfaceId = surfaceId;
  }

  /**
   * This is misnamed but has some uses out in the wild. It will be deleted in a future release of
   * RN.
   *
   * @return a {@link String} that represents the module name of the js application that is being
   *     rendered with this {@link ThemedReactContext}
   */
  @Deprecated
  public @Nullable String getSurfaceID() {
    return mModuleName;
  }

  /**
   * @return a {@link String} that represents the module name of the js application that is being
   *     rendered with this {@link ThemedReactContext}
   */
  public @Nullable String getModuleName() {
    return mModuleName;
  }

  public int getSurfaceId() {
    return mSurfaceId;
  }

  public ReactApplicationContext getReactApplicationContext() {
    return mReactApplicationContext;
  }
}
