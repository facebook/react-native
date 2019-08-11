/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import android.app.Activity;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Base class for Catalyst native modules that require access to the {@link ReactContext} instance.
 */
public abstract class ReactContextBaseJavaModule extends BaseJavaModule {

  private final ReactApplicationContext mReactApplicationContext;

  public ReactContextBaseJavaModule(@NonNull ReactApplicationContext reactContext) {
    mReactApplicationContext = reactContext;
  }

  /** Subclasses can use this method to access catalyst context passed as a constructor */
  protected final ReactApplicationContext getReactApplicationContext() {
    return mReactApplicationContext;
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
