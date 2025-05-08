/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static com.facebook.infer.annotation.ThreadConfined.UI;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;
import com.facebook.react.common.annotations.FrameworkAPI;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.common.annotations.internal.LegacyArchitecture;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import java.util.Collection;

/**
 * This is the bridge-specific concrete subclass of ReactContext. ReactContext has many methods that
 * delegate to the react instance. This subclass implements those methods, by delegating to the
 * CatalystInstance. If you need to create a ReactContext within an "bridge context", please create
 * BridgeReactContext.
 */
@DeprecatedInNewArchitecture
@VisibleForTesting
@LegacyArchitecture
public class BridgeReactContext extends ReactApplicationContext {
  static {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "BridgeReactContext", LegacyArchitectureLogLevel.WARNING);
  }

  @DoNotStrip
  public interface RCTDeviceEventEmitter extends JavaScriptModule {
    void emit(@NonNull String eventName, @Nullable Object data);
  }

  private static final String TAG = "BridgeReactContext";

  private static final String EARLY_JS_ACCESS_EXCEPTION_MESSAGE =
      "Tried to access a JS module before the React instance was fully set up. Calls to "
          + "ReactContext#getJSModule should only happen once initialize() has been called on your "
          + "native module.";
  private static final String LATE_JS_ACCESS_EXCEPTION_MESSAGE =
      "Tried to access a JS module after the React instance was destroyed.";
  private static final String EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE =
      "Trying to call native module before CatalystInstance has been set!";
  private static final String LATE_NATIVE_MODULE_EXCEPTION_MESSAGE =
      "Trying to call native module after CatalystInstance has been destroyed!";

  private volatile boolean mDestroyed = false;
  private @Nullable CatalystInstance mCatalystInstance;

  public BridgeReactContext(Context context) {
    super(context);
  }

  /** Set and initialize CatalystInstance for this Context. This should be called exactly once. */
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

  private void raiseCatalystInstanceMissingException() {
    throw new IllegalStateException(
        mDestroyed ? LATE_NATIVE_MODULE_EXCEPTION_MESSAGE : EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE);
  }

  /**
   * @return handle to the specified JS module for the CatalystInstance associated with this Context
   */
  @Override
  public <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface) {
    if (mCatalystInstance == null) {
      if (mDestroyed) {
        throw new IllegalStateException(LATE_JS_ACCESS_EXCEPTION_MESSAGE);
      }
      throw new IllegalStateException(EARLY_JS_ACCESS_EXCEPTION_MESSAGE);
    }
    if (mInteropModuleRegistry != null) {
      T jsModule = mInteropModuleRegistry.getInteropModule(jsInterface);
      if (jsModule != null) {
        return jsModule;
      }
    }
    return mCatalystInstance.getJSModule(jsInterface);
  }

  @Override
  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    if (mCatalystInstance == null) {
      raiseCatalystInstanceMissingException();
    }
    return mCatalystInstance.hasNativeModule(nativeModuleInterface);
  }

  @Override
  public Collection<NativeModule> getNativeModules() {
    if (mCatalystInstance == null) {
      raiseCatalystInstanceMissingException();
    }
    return mCatalystInstance.getNativeModules();
  }

  /**
   * @return the instance of the specified module interface associated with this ReactContext.
   */
  @Override
  @Nullable
  public <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    if (mCatalystInstance == null) {
      raiseCatalystInstanceMissingException();
    }
    return mCatalystInstance.getNativeModule(nativeModuleInterface);
  }

  @Override
  public @Nullable NativeModule getNativeModule(String moduleName) {
    if (mCatalystInstance == null) {
      raiseCatalystInstanceMissingException();
    }
    return mCatalystInstance.getNativeModule(moduleName);
  }

  @Override
  public CatalystInstance getCatalystInstance() {
    return Assertions.assertNotNull(mCatalystInstance);
  }

  /**
   * This API has been deprecated due to naming consideration, please use hasActiveReactInstance()
   * instead
   *
   * @return
   */
  @Deprecated
  @Override
  public boolean hasActiveCatalystInstance() {
    return hasActiveReactInstance();
  }

  /**
   * @return true if there is an non-null, alive react native instance
   */
  @Override
  public boolean hasActiveReactInstance() {
    return mCatalystInstance != null && !mCatalystInstance.isDestroyed();
  }

  /**
   * This API has been deprecated due to naming consideration, please use hasReactInstance() instead
   *
   * @return
   */
  @Deprecated
  @Override
  public boolean hasCatalystInstance() {
    return mCatalystInstance != null;
  }

  @Override
  public boolean hasReactInstance() {
    return mCatalystInstance != null;
  }

  /** Destroy this instance, making it unusable. */
  @Override
  @ThreadConfined(UI)
  public void destroy() {
    UiThreadUtil.assertOnUiThread();

    mDestroyed = true;
    if (mCatalystInstance != null) {
      mCatalystInstance.destroy();
    }
  }

  /**
   * Passes the given exception to the current {@link JSExceptionHandler} if one exists, rethrowing
   * otherwise.
   */
  @Override
  public void handleException(Exception e) {
    boolean catalystInstanceVariableExists = mCatalystInstance != null;
    boolean isCatalystInstanceAlive =
        catalystInstanceVariableExists && !mCatalystInstance.isDestroyed();
    boolean hasExceptionHandler = getJSExceptionHandler() != null;

    if (isCatalystInstanceAlive && hasExceptionHandler) {
      getJSExceptionHandler().handleException(e);
    } else {
      FLog.e(
          ReactConstants.TAG,
          "Unable to handle Exception - catalystInstanceVariableExists: "
              + catalystInstanceVariableExists
              + " - isCatalystInstanceAlive: "
              + isCatalystInstanceAlive
              + " - hasExceptionHandler: "
              + hasExceptionHandler,
          e);
      throw new IllegalStateException(e);
    }
  }

  /**
   * @deprecated DO NOT USE, this method will be removed in the near future.
   */
  @Deprecated
  @Override
  public boolean isBridgeless() {
    return false;
  }

  /**
   * Get the C pointer (as a long) to the JavaScriptCore context associated with this instance. Use
   * the following pattern to ensure that the JS context is not cleared while you are using it:
   * JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder()
   * synchronized(jsContext) { nativeThingNeedingJsContext(jsContext.get()); }
   */
  @Override
  @FrameworkAPI
  @UnstableReactNativeAPI
  public @Nullable JavaScriptContextHolder getJavaScriptContextHolder() {
    if (mCatalystInstance != null) {
      return mCatalystInstance.getJavaScriptContextHolder();
    }
    return null;
  }

  /**
   * Returns a hybrid object that contains a pointer to a JS CallInvoker, which is used to schedule
   * work on the JS Thread.
   */
  @Nullable
  @Override
  public CallInvokerHolder getJSCallInvokerHolder() {
    if (mCatalystInstance != null) {
      return mCatalystInstance.getJSCallInvokerHolder();
    }
    return null;
  }

  @DeprecatedInNewArchitecture(
      message =
          "This method will be deprecated later as part of Stable APIs with bridge removal and not"
              + " encouraged usage.")
  /**
   * Get the UIManager for Fabric from the CatalystInstance.
   *
   * @return The UIManager when CatalystInstance is active.
   */
  @Override
  public @Nullable UIManager getFabricUIManager() {
    return mCatalystInstance.getFabricUIManager();
  }

  /**
   * Get the sourceURL for the JS bundle from the CatalystInstance. This method is needed for
   * compatibility with bridgeless mode, which has no CatalystInstance.
   *
   * @return The JS bundle URL set when the bundle was loaded
   */
  @Override
  public @Nullable String getSourceURL() {
    return mCatalystInstance == null ? null : mCatalystInstance.getSourceURL();
  }

  /**
   * Register a JS segment after loading it from cache or server, make sure mCatalystInstance is
   * properly initialised and not null before calling.
   */
  @Override
  public void registerSegment(int segmentId, String path, Callback callback) {
    Assertions.assertNotNull(mCatalystInstance).registerSegment(segmentId, path);
    Assertions.assertNotNull(callback).invoke();
  }
}
