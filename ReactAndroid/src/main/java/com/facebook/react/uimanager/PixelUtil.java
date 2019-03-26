/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.util.TypedValue;

/**
 * Android dp to pixel manipulation
 */
public class PixelUtil {

  /**
   * Convert from DIP to PX
   */
  public static float toPixelFromDIP(float value) {
    return TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP,
        value,
        DisplayMetricsHolder.getWindowDisplayMetrics());
  }

  /**
   * Convert from DIP to PX
   */
  public static float toPixelFromDIP(double value) {
    return toPixelFromDIP((float) value);
  }

  /**
   * Convert from SP to PX
   */
  public static float toPixelFromSP(float value) {
    return TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_SP,
        value,
        DisplayMetricsHolder.getWindowDisplayMetrics());
  }

  /**
   * Convert from SP to PX
   */
  public static float toPixelFromSP(double value) {
    return toPixelFromSP((float) value);
  }

  /**
   * Convert from PX to DP
   */
  public static float toDIPFromPixel(float value) {
    return value / DisplayMetricsHolder.getWindowDisplayMetrics().density;
  }

}
