/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.view.View.MeasureSpec
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.yoga.YogaMeasureMode

public interface LayoutMetricsConversions {

  public companion object {
    @JvmStatic
    public fun getMinSize(viewMeasureSpec: Int): Float {
      val mode = MeasureSpec.getMode(viewMeasureSpec)
      val size = MeasureSpec.getSize(viewMeasureSpec)
      return if (mode == MeasureSpec.EXACTLY) size.toFloat() else 0f
    }

    @JvmStatic
    public fun getMaxSize(viewMeasureSpec: Int): Float {
      val mode = MeasureSpec.getMode(viewMeasureSpec)
      val size = MeasureSpec.getSize(viewMeasureSpec)

      // Infinity represents an "unconstrained" size
      return if (mode == MeasureSpec.UNSPECIFIED) Float.POSITIVE_INFINITY else size.toFloat()
    }

    @JvmStatic
    public fun getYogaSize(minSize: Float, maxSize: Float): Float =
        if (minSize == maxSize) {
          maxSize.dpToPx()
        } else if (maxSize.isInfinite()) {
          Float.POSITIVE_INFINITY
        } else {
          maxSize.dpToPx()
        }

    @JvmStatic
    public fun getYogaMeasureMode(minSize: Float, maxSize: Float): YogaMeasureMode =
        if (minSize == maxSize) {
          YogaMeasureMode.EXACTLY
        } else if (maxSize.isInfinite()) {
          YogaMeasureMode.UNDEFINED
        } else {
          YogaMeasureMode.AT_MOST
        }
  }
}
