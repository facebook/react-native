/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.util.DisplayMetrics;

/**
 * Holds an instance of the current DisplayMetrics so we don't have to thread it through all the
 * classes that need it.
 * Note: windowDisplayMetrics are deprecated in favor of ScreenDisplayMetrics: window metrics
 * are supposed to return the drawable area but there's no guarantee that they correspond to the
 * actual size of the {@link ReactRootView}. Moreover, they are not consistent with what iOS
 * returns. Screen metrics returns the metrics of the entire screen, is consistent with iOS and
 * should be used instead.
 */
public class DisplayMetricsHolder {

  private static DisplayMetrics sWindowDisplayMetrics;
  private static DisplayMetrics sScreenDisplayMetrics;

  /**
   * @deprecated Use {@link #setScreenDisplayMetrics(DisplayMetrics)} instead. See comment above as
   *    to why this is not correct to use.
   */
  public static void setWindowDisplayMetrics(DisplayMetrics displayMetrics) {
    sWindowDisplayMetrics = displayMetrics;
  }

  /**
   * @deprecated Use {@link #getScreenDisplayMetrics()} instead. See comment above as to why this
   *    is not correct to use.
   */
  @Deprecated
  public static DisplayMetrics getWindowDisplayMetrics() {
    return sWindowDisplayMetrics;
  }

  public static void setScreenDisplayMetrics(DisplayMetrics screenDisplayMetrics) {
    sScreenDisplayMetrics = screenDisplayMetrics;
  }

  public static DisplayMetrics getScreenDisplayMetrics() {
    return sScreenDisplayMetrics;
  }
}
