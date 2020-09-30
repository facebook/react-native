/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static com.facebook.infer.annotation.ThreadConfined.ANY;

import android.app.Activity;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.common.build.ReactBuildConfig;

/**
 * Base class for Catalyst native modules that require access to the {@link ReactContext} instance.
 */
public abstract class ReactContextBaseJavaModule extends BaseJavaModule {

  private final @Nullable ReactApplicationContext mReactApplicationContext;

  public ReactContextBaseJavaModule() {
    mReactApplicationContext = null;
  }

  public ReactContextBaseJavaModule(@Nullable ReactApplicationContext reactContext) {
    mReactApplicationContext = reactContext;
  }

  /** Subclasses can use this method to access catalyst context passed as a constructor. */
  protected final ReactApplicationContext getReactApplicationContext() {
    return Assertions.assertNotNull(
        mReactApplicationContext,
        "Tried to get ReactApplicationContext even though NativeModule wasn't instantiated with one");
  }

  /**
   * Subclasses can use this method to access catalyst context passed as a constructor. Use this
   * version to check that the underlying CatalystInstance is active before returning, and
   * automatically have SoftExceptions or debug information logged for you. Consider using this
   * whenever calling ReactApplicationContext methods that require the Catalyst instance be alive.
   *
   * <p>This can return null at any time, but especially during teardown methods it's
   * possible/likely.
   *
   * <p>Threading implications have not been analyzed fully yet, so assume this method is not
   * thread-safe.
   */
  @ThreadConfined(ANY)
  protected @Nullable final ReactApplicationContext getReactApplicationContextIfActiveOrWarn() {
    if (mReactApplicationContext.hasActiveCatalystInstance()
        || mReactApplicationContext.isBridgeless()) {
      return mReactApplicationContext;
    }

    // We want to collect data about how often this happens, but SoftExceptions will cause a crash
    // in debug mode, which isn't usually desirable.
    String msg = "Catalyst Instance has already disappeared: requested by " + this.getName();
    String tag = "ReactContextBaseJavaModule";
    if (ReactBuildConfig.DEBUG) {
      FLog.w(tag, msg);
    } else {
      ReactSoftException.logSoftException(tag, new RuntimeException(msg));
    }
    return null;
  }

  /**
   * Get the activity to which this context is currently attached, or {@code null} if not attached.
   *
   * <p>DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
   * MEMORY LEAKS.
   *
   * <p>For example, never store the value returned by this method in a member variable. Instead,
   * call this method whenever you actually need the Activity and make sure to check for {@code
   * null}.
   */
  protected @Nullable final Activity getCurrentActivity() {
    return mReactApplicationContext.getCurrentActivity();
  }
}
