/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.common.annotations.FrameworkAPI;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import java.util.Collection;

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

  @Override
  public <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface) {
    return mReactApplicationContext.getJSModule(jsInterface);
  }

  @Override
  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    return mReactApplicationContext.hasNativeModule(nativeModuleInterface);
  }

  @Override
  public Collection<NativeModule> getNativeModules() {
    return mReactApplicationContext.getNativeModules();
  }

  @Nullable
  @Override
  public <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    return mReactApplicationContext.getNativeModule(nativeModuleInterface);
  }

  @Nullable
  @FrameworkAPI
  @UnstableReactNativeAPI
  public RuntimeExecutor getRuntimeExecutor() {
    return mReactApplicationContext.getRuntimeExecutor();
  }

  @Deprecated
  @Override
  public CatalystInstance getCatalystInstance() {
    return mReactApplicationContext.getCatalystInstance();
  }

  @Deprecated
  @Override
  public boolean hasActiveCatalystInstance() {
    return mReactApplicationContext.hasActiveCatalystInstance();
  }

  @Override
  public boolean hasActiveReactInstance() {
    return mReactApplicationContext.hasActiveCatalystInstance();
  }

  @Deprecated
  @Override
  public boolean hasCatalystInstance() {
    return mReactApplicationContext.hasCatalystInstance();
  }

  @Override
  public void destroy() {
    mReactApplicationContext.destroy();
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

  @Override
  public void handleException(Exception e) {
    mReactApplicationContext.handleException(e);
  }

  @Deprecated
  @Override
  public boolean isBridgeless() {
    return mReactApplicationContext.isBridgeless();
  }

  @Deprecated
  @Nullable
  @Override
  public JavaScriptContextHolder getJavaScriptContextHolder() {
    return mReactApplicationContext.getJavaScriptContextHolder();
  }

  @Override
  public UIManager getFabricUIManager() {
    return mReactApplicationContext.getFabricUIManager();
  }

  @Nullable
  @Override
  public String getSourceURL() {
    return mReactApplicationContext.getSourceURL();
  }

  @Override
  public void registerSegment(int segmentId, String path, Callback callback) {
    mReactApplicationContext.registerSegment(segmentId, path, callback);
  }
}
