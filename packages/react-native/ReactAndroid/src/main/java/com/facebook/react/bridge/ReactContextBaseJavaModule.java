/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.app.Activity;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;

/**
 * Base class for Catalyst native modules that require access to the {@link ReactContext} instance.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public abstract class ReactContextBaseJavaModule extends BaseJavaModule {

  public ReactContextBaseJavaModule() {
    super(null);
  }

  public ReactContextBaseJavaModule(@Nullable ReactApplicationContext reactContext) {
    super(reactContext);
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
   *
   * @deprecated "Use 'getReactApplicationContext.getCurrentActivity() instead."
   */
  @Deprecated(forRemoval = true, since = "0.80.0")
  protected @Nullable final Activity getCurrentActivity() {
    return getReactApplicationContext().getCurrentActivity();
  }
}
