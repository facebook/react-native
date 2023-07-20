/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import android.graphics.Matrix;
import android.graphics.Rect;
import com.facebook.drawee.drawable.ScalingUtils;

public class ScaleTypeStartInside extends ScalingUtils.AbstractScaleType {
  public static final ScalingUtils.ScaleType INSTANCE = new ScaleTypeStartInside();

  @Override
  public void getTransformImpl(
      Matrix outTransform,
      Rect parentRect,
      int childWidth,
      int childHeight,
      float focusX,
      float focusY,
      float scaleX,
      float scaleY) {
    float scale = Math.min(Math.min(scaleX, scaleY), 1.0f);
    float dx = parentRect.left;
    float dy = parentRect.top;
    outTransform.setScale(scale, scale);
    outTransform.postTranslate((int) (dx + 0.5f), (int) (dy + 0.5f));
  }

  @Override
  public String toString() {
    return "start_inside";
  }
}
