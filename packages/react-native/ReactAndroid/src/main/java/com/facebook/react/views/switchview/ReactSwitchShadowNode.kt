/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview

import android.view.View
import com.facebook.react.common.annotations.LegacyArchitectureShadowNodeWithCxxImpl
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.yoga.YogaMeasureFunction
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import com.facebook.yoga.YogaNode

@Suppress("DEPRECATION")
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
@LegacyArchitectureShadowNodeWithCxxImpl
internal class ReactSwitchShadowNode :
    com.facebook.react.uimanager.LayoutShadowNode(), YogaMeasureFunction {
  private var width = 0
  private var height = 0
  private var measured = false

  init {
    initMeasureFunction()
  }

  private fun initMeasureFunction() {
    setMeasureFunction(this)
  }

  override fun measure(
      node: YogaNode,
      width: Float,
      widthMode: YogaMeasureMode,
      height: Float,
      heightMode: YogaMeasureMode,
  ): Long {
    if (!measured) {
      // Create a switch with the default config and measure it; since we don't (currently)
      // support setting custom switch text, this is fine, as all switches will measure the same
      // on a specific device/theme/locale combination.
      val reactSwitch = ReactSwitch(themedContext)
      reactSwitch.showText = false
      val spec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
      reactSwitch.measure(spec, spec)
      this.width = reactSwitch.measuredWidth
      this.height = reactSwitch.measuredHeight
      measured = true
    }

    return YogaMeasureOutput.make(this.width, this.height)
  }

  companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "ReactSwitchShadowNode",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
