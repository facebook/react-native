/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting;

import static android.view.View.MeasureSpec.EXACTLY;

import android.view.View;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.yoga.YogaMeasureMode;

public class LayoutMetricsConversions {

  // Represents the Layout constraint mode "undefined" from React side.
  public static final int REACT_CONSTRAINT_UNDEFINED = -2147483648;

  public static float getMinSize(int viewMeasureSpec) {
    int mode = View.MeasureSpec.getMode(viewMeasureSpec);
    int size = View.MeasureSpec.getSize(viewMeasureSpec);

    return mode == EXACTLY ? size : 0f;
  }

  public static float getMaxSize(int viewMeasureSpec) {
    int mode = View.MeasureSpec.getMode(viewMeasureSpec);
    int size = View.MeasureSpec.getSize(viewMeasureSpec);

    return mode == View.MeasureSpec.UNSPECIFIED ? REACT_CONSTRAINT_UNDEFINED : size;
  }

  public static float getYogaSize(float minSize, float maxSize) {
    float yogaSize;
    if (minSize == maxSize) {
      yogaSize = PixelUtil.toPixelFromDIP(maxSize);
    } else if (maxSize == REACT_CONSTRAINT_UNDEFINED) {
      yogaSize = 0;
    } else {
      yogaSize = PixelUtil.toPixelFromDIP(maxSize);
    }
    return yogaSize;
  }

  public static YogaMeasureMode getYogaMeasureMode(float minSize, float maxSize) {
    YogaMeasureMode yogaMeasureMode;
    if (minSize == maxSize) {
      yogaMeasureMode = YogaMeasureMode.EXACTLY;
    } else if (maxSize == REACT_CONSTRAINT_UNDEFINED) {
      yogaMeasureMode = YogaMeasureMode.UNDEFINED;
    } else {
      yogaMeasureMode = YogaMeasureMode.AT_MOST;
    }
    return yogaMeasureMode;
  }
}
