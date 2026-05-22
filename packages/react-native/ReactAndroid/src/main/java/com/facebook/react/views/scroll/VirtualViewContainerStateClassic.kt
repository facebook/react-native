/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.view.ViewGroup
import com.facebook.react.views.virtual.VirtualViewMode

internal class VirtualViewContainerStateClassic(scrollView: ViewGroup) :
    VirtualViewContainerState(scrollView) {

  // Provide the concrete implementation for the abstract virtualViews property
  override val virtualViews: MutableCollection<VirtualView> = mutableSetOf()

  // Implement the abstract updateModes method
  override fun updateModes(virtualView: VirtualView?) {
    scrollView.getDrawingRect(visibleRect)

    if (visibleRect.isEmpty()) {
      return
    }

    prerenderRect.set(visibleRect)
    prerenderRect.inset(
        (-prerenderRect.width() * prerenderRatio).toInt(),
        (-prerenderRect.height() * prerenderRatio).toInt(),
    )

    val virtualViewsIt =
        if (virtualView != null) listOf(virtualView) else virtualViews.toMutableSet()
    virtualViewsIt.forEach { vv ->
      val rect = vv.containerRelativeRect

      var mode: VirtualViewMode = VirtualViewMode.Hidden
      var thresholdRect = emptyRect
      when {
        rectsOverlap(rect, visibleRect) -> {
          thresholdRect = visibleRect
          mode = VirtualViewMode.Visible
        }
        rectsOverlap(rect, prerenderRect) -> {
          mode = VirtualViewMode.Prerender
          thresholdRect = prerenderRect
        }
      }

      vv.onModeChange(mode, thresholdRect)
    }
  }
}
