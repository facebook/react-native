/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;
import java.util.Collection;

/**
 * This is the bridge-specific concrete subclass of ReactContext. ReactContext has many methods that
 * delegate to the react instance. This subclass implements those methods, by delegating to the
 * CatalystInstance. If you need to create a ReactContext within an "bridge context", please create
 * BridgeReactContext.
 */
@DeprecatedInNewArchitecture
@Nullsafe(Nullsafe.Mode.LOCAL)
public class BridgeReactContext extends ReactApplicationContext {

  private static final String TAG = "BridgeReactContext";

  private static final String EARLY_CALL_EXCEPTION_MESSAGE =
      "Called %s before setting the Catalyst instance!";

  private static final String LATE_CALL_EXCEPTION_MESSAGE =
      "Called %s after destroying the Catalyst instance!";

  private volatile boolean mDestroyed = false;
  private @Nullable CatalystInstance mCatalystInstance;

  public BridgeReactContext(Context context) {
    super(context);
  }

  public void initializeWithInstance(CatalystInstance catalystInstance) {
    if (catalystInstance == null) {
      throw new IllegalArgumentException("CatalystInstance cannot be null.");
    }
    if (mCatalystInstance != null) {
      throw new IllegalStateException("ReactContext has been already initialized");
    }
    if (mDestroyed) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalStateException("Cannot initialize ReactContext after it has been destroyed."));
    }

    mCatalystInstance = catalystInstance;

    ReactQueueConfiguration queueConfig = catalystInstance.getReactQueueConfiguration();
    initializeMessageQueueThreads(queueConfig);
    initializeInteropModules();
  }

  @Override
  public void destroy() {
    UiThreadUtil.assertOnUiThread();

    mDestroyed = true;
    if (mCatalystInstance != null) {
      mCatalystInstance.destroy();
    }
  }

  @Override
  public CatalystInstance getCatalystInstance() {
    return Assertions.assertNotNull(mCatalystInstance);
  }

  @Override
  public @Nullable UIManager getFabricUIManager() {
    CatalystInstance catalystInstance = getNonNullableCatalystInstanceOrThrow("getFabricUIManager");
    UIManager uiManager = catalystInstance.getFabricUIManager();
    return uiManager != null
        ? uiManager
        : (UIManager) catalystInstance.getJSIModule(JSIModuleType.UIManager);
  }

  @Override
  public @Nullable JavaScriptContextHolder getJavaScriptContextHolder() {
    return mCatalystInstance != null ? mCatalystInstance.getJavaScriptContextHolder() : null;
  }

  @Override
  public <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface) {
    CatalystInstance catalystInstance = getNonNullableCatalystInstanceOrThrow("getJSModule");

    if (mInteropModuleRegistry != null
        && mInteropModuleRegistry.shouldReturnInteropModule(jsInterface)) {
      return mInteropModuleRegistry.getInteropModule(jsInterface);
    }

    return catalystInstance.getJSModule(jsInterface);
  }

  @Override
  public @Nullable <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    CatalystInstance catalystInstance = getNonNullableCatalystInstanceOrThrow("getNativeModule");
    return catalystInstance.getNativeModule(nativeModuleInterface);
  }

  @Override
  public Collection<NativeModule> getNativeModules() {
    CatalystInstance catalystInstance = getNonNullableCatalystInstanceOrThrow("getNativeModules");
    return catalystInstance.getNativeModules();
  }

  @Override
  public @Nullable RuntimeExecutor getRuntimeExecutor() {
    CatalystInstance catalystInstance = getNonNullableCatalystInstanceOrThrow("getRuntimeExecutor");
    return catalystInstance.getRuntimeExecutor();
  }

  @Override
  public @Nullable String getSourceURL() {
    return mCatalystInstance != null ? mCatalystInstance.getSourceURL() : null;
  }

  @Override
  public void handleException(Exception e) {
    JSExceptionHandler jsExceptionHandler = getJSExceptionHandler();
    if (hasActiveReactInstance() && jsExceptionHandler != null) {
      jsExceptionHandler.handleException(e);
    } else {
      FLog.e(
          ReactConstants.TAG,
          "Unable to handle Exception - catalystInstanceVariableExists: "
              + (mCatalystInstance != null)
              + " - isCatalystInstanceAlive: "
              + hasActiveReactInstance()
              + " - hasExceptionHandler: "
              + (jsExceptionHandler != null),
          e);
      throw new IllegalStateException(e);
    }
  }

  @Deprecated
  @Override
  public boolean hasActiveCatalystInstance() {
    return hasActiveReactInstance();
  }

  @Override
  public boolean hasActiveReactInstance() {
    return mCatalystInstance != null && !mCatalystInstance.isDestroyed();
  }

  @Override
  public boolean hasCatalystInstance() {
    return mCatalystInstance != null;
  }

  @Override
  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    CatalystInstance catalystInstance = getNonNullableCatalystInstanceOrThrow("hasNativeModule");
    return catalystInstance.hasNativeModule(nativeModuleInterface);
  }

  @Override
  public boolean isBridgeless() {
    return false;
  }

  @Override
  public void registerSegment(int segmentId, String path, Callback callback) {
    Assertions.assertNotNull(mCatalystInstance).registerSegment(segmentId, path);
    Assertions.assertNotNull(callback).invoke();
  }

  private CatalystInstance getNonNullableCatalystInstanceOrThrow(String accessTarget) {
    if (mCatalystInstance != null) {
      return mCatalystInstance;
    }
    throw new IllegalStateException(
        String.format(
            mDestroyed ? LATE_CALL_EXCEPTION_MESSAGE : EARLY_CALL_EXCEPTION_MESSAGE, accessTarget));
  }
}
