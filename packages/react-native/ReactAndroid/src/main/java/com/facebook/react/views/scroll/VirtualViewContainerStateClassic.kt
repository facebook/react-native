/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.view.ViewGroup
import com.facebook.common.logging.FLog
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.views.virtual.VirtualViewMode

internal class VirtualViewContainerStateClassic(scrollView: ViewGroup) :
    VirtualViewContainerState(scrollView) {

  // Provide the concrete implementation for the abstract virtualViews property
  override val virtualViews: MutableCollection<VirtualView> = mutableSetOf()

  // Implement the abstract updateModes method
  override fun updateModes(virtualView: VirtualView?) {
    scrollView.getDrawingRect(visibleRect)

    if (visibleRect.isEmpty()) {
      debugLog("updateModes", { "scrollView visibleRect is empty" })
      return
    }

    prerenderRect.set(visibleRect)
    prerenderRect.inset(
        (-prerenderRect.width() * prerenderRatio).toInt(),
        (-prerenderRect.height() * prerenderRatio).toInt(),
    )

    if (hysteresisRatio > 0.0) {
      hysteresisRect.set(prerenderRect)
      hysteresisRect.inset(
          (-visibleRect.width() * hysteresisRatio).toInt(),
          (-visibleRect.height() * hysteresisRatio).toInt(),
      )
    }

    val virtualViewsIt =
        if (virtualView != null) listOf(virtualView) else virtualViews.toMutableSet()
    virtualViewsIt.forEach { vv ->
      val rect = vv.containerRelativeRect

      var mode: VirtualViewMode? = VirtualViewMode.Hidden
      var thresholdRect = emptyRect
      when {
        rectsOverlap(rect, visibleRect) -> {
          thresholdRect = visibleRect
          if (onWindowFocusChangeListener != null) {
            if (scrollView.hasWindowFocus()) {
              mode = VirtualViewMode.Visible
            } else {
              mode = VirtualViewMode.Prerender
            }
          } else {
            mode = VirtualViewMode.Visible
          }
        }
        rectsOverlap(rect, prerenderRect) -> {
          mode = VirtualViewMode.Prerender
          thresholdRect = prerenderRect
        }
        (hysteresisRatio > 0.0 && rectsOverlap(rect, hysteresisRect)) -> {
          mode = null
        }
      }

      if (mode != null) {
        vv.onModeChange(mode, thresholdRect)
        debugLog(
            "updateModes",
            {
              "virtualView=${vv.virtualViewID} mode=$mode  rect=$rect thresholdRect=$thresholdRect"
            },
        )
      }
    }
  }
}

private const val DEBUG_TAG: String = "VirtualViewContainerStateClassic"

private inline fun debugLog(subtag: String, block: () -> String = { "" }) {
  if (IS_DEBUG_BUILD && ReactNativeFeatureFlags.enableVirtualViewDebugFeatures()) {
    FLog.d("$DEBUG_TAG:$subtag", block())
  }
}
