/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.progressbar

import android.util.SparseIntArray
import android.view.View
import android.view.ViewGroup
import com.facebook.react.common.annotations.LegacyArchitectureShadowNodeWithCxxImpl
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.yoga.YogaMeasureFunction
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import com.facebook.yoga.YogaNode

/**
 * Node responsible for holding the style of the ProgressBar, see under [ ] for possible styles.
 * ReactProgressBarViewManager manages how this style is applied to the ProgressBar.
 */
@Suppress("DEPRECATION")
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@LegacyArchitectureShadowNodeWithCxxImpl
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal class ProgressBarShadowNode :
    com.facebook.react.uimanager.LayoutShadowNode(), YogaMeasureFunction {
  private val height: SparseIntArray = SparseIntArray()
  private val width: SparseIntArray = SparseIntArray()
  private val measured: MutableSet<Int> = HashSet()

  init {
    setMeasureFunction(this)
  }

  @set:ReactProp(name = ReactProgressBarViewManager.PROP_STYLE)
  var style: String? = ReactProgressBarViewManager.DEFAULT_STYLE
    set(value) {
      field = value ?: ReactProgressBarViewManager.DEFAULT_STYLE
    }

  override fun measure(
      node: YogaNode,
      width: Float,
      widthMode: YogaMeasureMode,
      height: Float,
      heightMode: YogaMeasureMode,
  ): Long {
    val style = ReactProgressBarViewManager.getStyleFromString(style)
    if (!measured.contains(style)) {
      val progressBar = ReactProgressBarViewManager.createProgressBar(themedContext, style)
      val spec =
          View.MeasureSpec.makeMeasureSpec(
              ViewGroup.LayoutParams.WRAP_CONTENT,
              View.MeasureSpec.UNSPECIFIED,
          )
      progressBar.measure(spec, spec)
      this.height.put(style, progressBar.measuredHeight)
      this.width.put(style, progressBar.measuredWidth)
      measured.add(style)
    }
    return YogaMeasureOutput.make(this.width[style], this.height[style])
  }

  companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "ProgressBarShadowNode",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
