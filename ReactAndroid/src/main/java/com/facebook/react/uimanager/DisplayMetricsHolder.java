/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.WindowManager;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

/**
 * Holds an instance of the current DisplayMetrics so we don't have to thread it through all the
 * classes that need it. Note: windowDisplayMetrics are deprecated in favor of ScreenDisplayMetrics:
 * window metrics are supposed to return the drawable area but there's no guarantee that they
 * correspond to the actual size of the {@link ReactRootView}. Moreover, they are not consistent
 * with what iOS returns. Screen metrics returns the metrics of the entire screen, is consistent
 * with iOS and should be used instead.
 */
public class DisplayMetricsHolder {

  private static @Nullable DisplayMetrics sWindowDisplayMetrics;
  private static @Nullable DisplayMetrics sScreenDisplayMetrics;

  /**
   * @deprecated Use {@link #setScreenDisplayMetrics(DisplayMetrics)} instead. See comment above as
   *     to why this is not correct to use.
   */
  public static void setWindowDisplayMetrics(DisplayMetrics displayMetrics) {
    sWindowDisplayMetrics = displayMetrics;
  }

  public static void initDisplayMetricsIfNotInitialized(Context context) {
    if (DisplayMetricsHolder.getScreenDisplayMetrics() != null) {
      return;
    }
    initDisplayMetrics(context);
  }

  public static void initDisplayMetrics(Context context) {
    DisplayMetrics displayMetrics = context.getResources().getDisplayMetrics();
    DisplayMetricsHolder.setWindowDisplayMetrics(displayMetrics);

    DisplayMetrics screenDisplayMetrics = new DisplayMetrics();
    screenDisplayMetrics.setTo(displayMetrics);
    WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    Assertions.assertNotNull(wm, "WindowManager is null!");
    Display display = wm.getDefaultDisplay();

    // Get the real display metrics if we are using API level 17 or higher.
    // The real metrics include system decor elements (e.g. soft menu bar).
    //
    // See:
    // http://developer.android.com/reference/android/view/Display.html#getRealMetrics(android.util.DisplayMetrics)
    display.getRealMetrics(screenDisplayMetrics);
    DisplayMetricsHolder.setScreenDisplayMetrics(screenDisplayMetrics);
  }

  /**
   * @deprecated Use {@link #getScreenDisplayMetrics()} instead. See comment above as to why this is
   *     not correct to use.
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

  public static WritableMap getDisplayMetricsWritableMap(double fontScale) {
    Assertions.assertCondition(
        sWindowDisplayMetrics != null && sScreenDisplayMetrics != null,
        "DisplayMetricsHolder must be initialized with initDisplayMetricsIfNotInitialized or"
            + " initDisplayMetrics");
    final WritableNativeMap result = new WritableNativeMap();
    result.putMap(
        "windowPhysicalPixels", getPhysicalPixelsWritableMap(sWindowDisplayMetrics, fontScale));
    result.putMap(
        "screenPhysicalPixels", getPhysicalPixelsWritableMap(sScreenDisplayMetrics, fontScale));
    return result;
  }

  private static WritableMap getPhysicalPixelsWritableMap(
      DisplayMetrics displayMetrics, double fontScale) {
    final WritableNativeMap result = new WritableNativeMap();
    result.putInt("width", displayMetrics.widthPixels);
    result.putInt("height", displayMetrics.heightPixels);
    result.putDouble("scale", displayMetrics.density);
    result.putDouble("fontScale", fontScale);
    result.putDouble("densityDpi", displayMetrics.densityDpi);
    return result;
  }
}
