/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.app.Activity

/** Base class for Catalyst native modules that require access to the [ReactContext] instance. */
public abstract class ReactContextBaseJavaModule : BaseJavaModule {
  public constructor() : super(null)

  public constructor(reactContext: ReactApplicationContext?) : super(reactContext)

  /**
   * Get the activity to which this context is currently attached, or `null` if not attached.
   *
   * DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
   * MEMORY LEAKS.
   *
   * For example, never store the value returned by this method in a member variable. Instead, call
   * this method whenever you actually need the Activity and make sure to check for `null`.
   */
  @Deprecated(
      "Deprecated in 0.80.0. Use getReactApplicationContext().getCurrentActivity() instead.",
      ReplaceWith("reactApplicationContext.currentActivity"),
  )
  protected fun getCurrentActivity(): Activity? {
    return reactApplicationContext.currentActivity
  }
}
