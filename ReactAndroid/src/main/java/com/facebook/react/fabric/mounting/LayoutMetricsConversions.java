/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting;

import static android.view.View.MeasureSpec.EXACTLY;

import android.view.View;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.yoga.YogaMeasureMode;

public class LayoutMetricsConversions {

  public static float getMinSize(int viewMeasureSpec) {
    int mode = View.MeasureSpec.getMode(viewMeasureSpec);
    int size = View.MeasureSpec.getSize(viewMeasureSpec);

    return mode == EXACTLY ? size : 0f;
  }

  public static float getMaxSize(int viewMeasureSpec) {
    int mode = View.MeasureSpec.getMode(viewMeasureSpec);
    int size = View.MeasureSpec.getSize(viewMeasureSpec);

    // Infinity represents an "unconstrained" size
    return mode == View.MeasureSpec.UNSPECIFIED ? Float.POSITIVE_INFINITY : size;
  }

  public static float getYogaSize(float minSize, float maxSize) {
    if (minSize == maxSize) {
      return PixelUtil.toPixelFromDIP(maxSize);
    } else if (Float.isInfinite(maxSize)) {
      return Float.POSITIVE_INFINITY;
    } else {
      return PixelUtil.toPixelFromDIP(maxSize);
    }
  }

  public static YogaMeasureMode getYogaMeasureMode(float minSize, float maxSize) {
    if (minSize == maxSize) {
      return YogaMeasureMode.EXACTLY;
    } else if (Float.isInfinite(maxSize)) {
      return YogaMeasureMode.UNDEFINED;
    } else {
      return YogaMeasureMode.AT_MOST;
    }
  }
}
