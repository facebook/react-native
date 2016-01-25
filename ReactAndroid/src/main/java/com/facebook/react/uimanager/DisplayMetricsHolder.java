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
 */
public class DisplayMetricsHolder {

  private static DisplayMetrics sCurrentDisplayMetrics;

  public static void setDisplayMetrics(DisplayMetrics displayMetrics) {
    sCurrentDisplayMetrics = displayMetrics;
  }

  public static DisplayMetrics getDisplayMetrics() {
    return sCurrentDisplayMetrics;
  }
}
