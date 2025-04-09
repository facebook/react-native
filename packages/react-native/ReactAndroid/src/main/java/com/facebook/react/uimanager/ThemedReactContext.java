/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.app.Activity;
import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import java.util.Collection;

/**
 * Wraps {@link ReactContext} with the base {@link Context} passed into the constructor. It provides
 * also a way to start activities using the viewContext to which RN native views belong. It
 * delegates lifecycle listener registration to the original instance of {@link ReactContext} which
 * is supposed to receive the lifecycle events. At the same time we disallow receiving lifecycle
 * events for this wrapper instances. TODO: T7538544 Rename ThemedReactContext to be in alignment
 * with name of ReactApplicationContext
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
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
    super(base);
    initializeFromOther(reactApplicationContext);
    mReactApplicationContext = reactApplicationContext;
    mModuleName = moduleName;
    mSurfaceId = surfaceId;
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

  @Override
  public @Nullable <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    return mReactApplicationContext.getNativeModule(nativeModuleInterface);
  }

  @Override
  public @Nullable NativeModule getNativeModule(String moduleName) {
    return mReactApplicationContext.getNativeModule(moduleName);
  }

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

  @Override
  public boolean hasCatalystInstance() {
    return mReactApplicationContext.hasCatalystInstance();
  }

  @Override
  public boolean hasReactInstance() {
    return mReactApplicationContext.hasReactInstance();
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

  @Override
  public @Nullable JavaScriptContextHolder getJavaScriptContextHolder() {
    return mReactApplicationContext.getJavaScriptContextHolder();
  }

  @Override
  public @Nullable CallInvokerHolder getJSCallInvokerHolder() {
    return mReactApplicationContext.getJSCallInvokerHolder();
  }

  @Override
  public @Nullable UIManager getFabricUIManager() {
    return mReactApplicationContext.getFabricUIManager();
  }

  @Override
  public @Nullable String getSourceURL() {
    return mReactApplicationContext.getSourceURL();
  }

  @Override
  public void registerSegment(int segmentId, String path, Callback callback) {
    mReactApplicationContext.registerSegment(segmentId, path, callback);
  }
}
