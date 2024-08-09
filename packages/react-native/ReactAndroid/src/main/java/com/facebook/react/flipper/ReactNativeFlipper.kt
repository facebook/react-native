/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flipper

import android.content.Context
import com.facebook.react.ReactInstanceManager

/**
 * Stub class that does nothing to ease the migration out of Flipper. Users should stop calling
 * `ReactNativeFlipper.initializeFlipper` in their `MainApplication.java` as this class will be
 * removed in React Native 0.75 or future versions.
 */
@Deprecated(
    message =
        "ReactNative/Flipper integration is deprecated. Please remove the call to initializeFlipper from your MainApplication.java",
    replaceWith = ReplaceWith(""),
    level = DeprecationLevel.WARNING)
public object ReactNativeFlipper {
  @Suppress("UNUSED_PARAMETER")
  @JvmStatic
  @Deprecated(
      message =
          "ReactNative/Flipper integration is deprecated. Please remove the call to initializeFlipper from your MainApplication.java",
      replaceWith = ReplaceWith(""),
      level = DeprecationLevel.WARNING)
  public fun initializeFlipper(context: Context, reactInstanceManager: ReactInstanceManager) {
    // no-op
  }
}
