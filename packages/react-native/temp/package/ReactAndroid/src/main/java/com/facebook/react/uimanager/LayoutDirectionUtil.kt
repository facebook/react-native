/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.yoga.YogaDirection

internal object LayoutDirectionUtil {
  @JvmStatic
  public fun toAndroidFromYoga(direction: YogaDirection): Int =
      when (direction) {
        YogaDirection.LTR -> View.LAYOUT_DIRECTION_LTR
        YogaDirection.RTL -> View.LAYOUT_DIRECTION_RTL
        else -> View.LAYOUT_DIRECTION_INHERIT
      }

  @JvmStatic
  public fun toYogaFromAndroid(direction: Int): YogaDirection =
      when (direction) {
        View.LAYOUT_DIRECTION_LTR -> YogaDirection.LTR
        View.LAYOUT_DIRECTION_RTL -> YogaDirection.RTL
        else -> YogaDirection.INHERIT
      }
}
