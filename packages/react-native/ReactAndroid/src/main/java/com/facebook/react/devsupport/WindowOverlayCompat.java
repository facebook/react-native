/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.os.Build;
import android.view.WindowManager;

/**
 * Compatibility wrapper for apps targeting API level 26 or later. See
 * https://developer.android.com/about/versions/oreo/android-8.0-changes.html#cwt
 */
/* package */ class WindowOverlayCompat {

  private static final int ANDROID_OREO = 26;
  private static final int TYPE_APPLICATION_OVERLAY = 2038;

  static final int TYPE_SYSTEM_ALERT =
      Build.VERSION.SDK_INT < ANDROID_OREO
          ? WindowManager.LayoutParams.TYPE_SYSTEM_ALERT
          : TYPE_APPLICATION_OVERLAY;
  static final int TYPE_SYSTEM_OVERLAY =
      Build.VERSION.SDK_INT < ANDROID_OREO
          ? WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY
          : TYPE_APPLICATION_OVERLAY;
}
