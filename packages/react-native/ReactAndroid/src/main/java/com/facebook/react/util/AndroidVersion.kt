/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.util

import android.content.Context
import android.os.Build

/** Helper class for checking Android version-related information. */
internal object AndroidVersion {

  /**
   * This is the version code for Android 16 (SDK Level 36). Delete it once we bump up the default
   * compile SDK version to 36.
   */
  private const val VERSION_CODE_BAKLAVA: Int = 36

  /**
   * This method is used to check if the current device is running Android 16 (SDK Level 36) or
   * higher and the app is targeting Android 16 (SDK Level 36) or higher.
   */
  @JvmStatic
  fun isAtLeastTargetSdk36(context: Context): Boolean =
      Build.VERSION.SDK_INT >= VERSION_CODE_BAKLAVA &&
          context.applicationInfo.targetSdkVersion >= VERSION_CODE_BAKLAVA
}
