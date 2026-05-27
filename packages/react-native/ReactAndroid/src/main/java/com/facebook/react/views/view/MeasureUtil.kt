/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.view.View
import com.facebook.yoga.YogaMeasureMode

internal object MeasureUtil {

  @JvmStatic
  fun getMeasureSpec(size: Float, mode: YogaMeasureMode): Int =
      when (mode) {
        YogaMeasureMode.EXACTLY ->
            View.MeasureSpec.makeMeasureSpec(size.toInt(), View.MeasureSpec.EXACTLY)
        YogaMeasureMode.AT_MOST ->
            View.MeasureSpec.makeMeasureSpec(size.toInt(), View.MeasureSpec.AT_MOST)
        else -> View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
      }
}
