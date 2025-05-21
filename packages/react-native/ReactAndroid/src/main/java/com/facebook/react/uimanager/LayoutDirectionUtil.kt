/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.yoga.YogaDirection

@LegacyArchitecture
internal object LayoutDirectionUtil {
  init {
    LegacyArchitectureLogger.assertLegacyArchitecture("LayoutDirectionUtil")
  }

  @JvmStatic
  fun toAndroidFromYoga(direction: YogaDirection): Int =
      when (direction) {
        YogaDirection.LTR -> View.LAYOUT_DIRECTION_LTR
        YogaDirection.RTL -> View.LAYOUT_DIRECTION_RTL
        else -> View.LAYOUT_DIRECTION_INHERIT
      }

  @JvmStatic
  fun toYogaFromAndroid(direction: Int): YogaDirection =
      when (direction) {
        View.LAYOUT_DIRECTION_LTR -> YogaDirection.LTR
        View.LAYOUT_DIRECTION_RTL -> YogaDirection.RTL
        else -> YogaDirection.INHERIT
      }
}
