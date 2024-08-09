/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static com.facebook.infer.annotation.ThreadConfined.ANY;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;
import com.facebook.react.common.annotations.StableReactNativeAPI;
import com.facebook.react.common.build.ReactBuildConfig;
import java.util.Map;

/**
 * Base class for Catalyst native modules whose implementations are written in Java. Default
 * implementations for {@link #initialize} and {@link #onCatalystInstanceDestroy} are provided for
 * convenience. Subclasses which override these don't need to call {@code super} in case of
 * overriding those methods as implementation of those methods is empty.
 *
 * <p>BaseJavaModules can be linked to Fragments' lifecycle events, {@link CatalystInstance}
 * creation and destruction, by being called on the appropriate method when a life cycle event
 * occurs.
 *
 * <p>Native methods can be exposed to JS with {@link ReactMethod} annotation. Those methods may
 * only use limited number of types for their arguments:
 *
 * <ol>
 *   <li>primitives (boolean, int, float, double
 *   <li>{@link String} mapped from JS string
 *   <li>{@link ReadableArray} mapped from JS Array
 *   <li>{@link ReadableMap} mapped from JS Object
 *   <li>{@link Callback} mapped from js function and can be used only as a last parameter or in the
 *       case when it express success & error callback pair as two last arguments respectively.
 * </ol>
 *
 * <p>All methods exposed as native to JS with {@link ReactMethod} annotation must return {@code
 * void}.
 *
 * <p>Please note that it is not allowed to have multiple methods annotated with {@link ReactMethod}
 * with the same name.
 */
@StableReactNativeAPI
public abstract class BaseJavaModule implements NativeModule {
  // taken from Libraries/Utilities/MessageQueue.js
  public static final String METHOD_TYPE_ASYNC = "async";
  public static final String METHOD_TYPE_PROMISE = "promise";
  public static final String METHOD_TYPE_SYNC = "sync";

  private final @Nullable ReactApplicationContext mReactApplicationContext;

  public BaseJavaModule() {
    this(null);
  }

  public BaseJavaModule(@Nullable ReactApplicationContext reactContext) {
    mReactApplicationContext = reactContext;
  }

  /** @return a map of constants this module exports to JS. Supports JSON types. */
  @DeprecatedInNewArchitecture()
  public @Nullable Map<String, Object> getConstants() {
    return null;
  }

  @Override
  public void initialize() {
    // do nothing
  }

  @Override
  public boolean canOverrideExistingModule() {
    return false;
  }

  /**
   * The CatalystInstance is going away with Venice. Therefore, the TurboModule infra introduces the
   * invalidate() method to allow NativeModules to clean up after themselves.
   */
  @Override
  public void invalidate() {}

  /**
   * Subclasses can use this method to access {@link ReactApplicationContext} passed as a
   * constructor.
   */
  protected final ReactApplicationContext getReactApplicationContext() {
    return Assertions.assertNotNull(
        mReactApplicationContext,
        "Tried to get ReactApplicationContext even though NativeModule wasn't instantiated with one");
  }

  /**
   * Subclasses can use this method to access {@link ReactApplicationContext} passed as a
   * constructor. Use this version to check that the underlying React Instance is active before
   * returning, and automatically have SoftExceptions or debug information logged for you. Consider
   * using this whenever calling ReactApplicationContext methods that require the React instance be
   * alive.
   *
   * <p>This can return null at any time, but especially during teardown methods it's
   * possible/likely.
   *
   * <p>Threading implications have not been analyzed fully yet, so assume this method is not
   * thread-safe.
   */
  @ThreadConfined(ANY)
  protected @Nullable final ReactApplicationContext getReactApplicationContextIfActiveOrWarn() {
    if (mReactApplicationContext.hasActiveReactInstance()) {
      return mReactApplicationContext;
    }

    // We want to collect data about how often this happens, but SoftExceptions will cause a crash
    // in debug mode, which isn't usually desirable.
    String msg = "React Native Instance has already disappeared: requested by " + getName();
    if (ReactBuildConfig.DEBUG) {
      FLog.w(ReactConstants.TAG, msg);
    } else {
      ReactSoftExceptionLogger.logSoftException(ReactConstants.TAG, new RuntimeException(msg));
    }
    return null;
  }
}
