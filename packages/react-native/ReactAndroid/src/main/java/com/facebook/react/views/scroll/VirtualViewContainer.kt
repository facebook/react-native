/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.graphics.Rect
import android.view.ViewGroup
import android.view.ViewTreeObserver
import com.facebook.common.logging.FLog
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.views.virtual.VirtualViewMode
import java.util.*

internal interface VirtualViewContainer {
  public val virtualViewContainerState: VirtualViewContainerState
}

public interface VirtualView {
  public val virtualViewID: String

  public val containerRelativeRect: Rect

  public fun onModeChange(newMode: VirtualViewMode, thresholdRect: Rect): Unit
}

/**
 * Checks whether one Rect overlaps with another Rect.
 *
 * This is different from [Rect.intersects] because a Rect representing a line or a point is
 * considered to overlap with another Rect if the line or point is within the rect bounds. However,
 * two Rects are not considered to overlap if they only share a boundary.
 */
private fun rectsOverlap(rect1: Rect, rect2: Rect): Boolean {
  if (rect1.top >= rect2.bottom || rect2.top >= rect1.bottom) {
    // No overlap on the y-axis.
    return false
  }
  if (rect1.left >= rect2.right || rect2.left >= rect1.right) {
    // No overlap on the x-axis.
    return false
  }
  return true
}

internal class VirtualViewContainerState {

  private val prerenderRatio: Double = ReactNativeFeatureFlags.virtualViewPrerenderRatio()

  private val virtualViews: MutableSet<VirtualView> = mutableSetOf()
  private val emptyRect: Rect = Rect()
  private val visibleRect: Rect = Rect()
  private val prerenderRect: Rect = Rect()
  private val onWindowFocusChangeListener =
      if (ReactNativeFeatureFlags.enableVirtualViewWindowFocusDetection()) {
        ViewTreeObserver.OnWindowFocusChangeListener {
          debugLog("onWindowFocusChanged")
          updateModes()
        }
      } else {
        null
      }

  private val scrollView: ViewGroup

  constructor(scrollView: ViewGroup) {
    this.scrollView = scrollView
    if (onWindowFocusChangeListener != null) {
      scrollView.viewTreeObserver.addOnWindowFocusChangeListener(onWindowFocusChangeListener)
    }
  }

  public fun cleanup() {
    if (onWindowFocusChangeListener != null) {
      scrollView.viewTreeObserver.removeOnWindowFocusChangeListener(onWindowFocusChangeListener)
    }
  }

  public fun onChange(virtualView: VirtualView) {
    if (virtualViews.add(virtualView)) {
      debugLog("add", { "virtualViewID=${virtualView.virtualViewID}" })
    } else {
      debugLog("update", { "virtualViewID=${virtualView.virtualViewID}" })
    }
    updateModes(virtualView)
  }

  public fun remove(virtualView: VirtualView) {
    assert(virtualViews.remove(virtualView)) {
      "Attempting to remove non-existent VirtualView: ${virtualView.virtualViewID}"
    }
    debugLog("remove", { "virtualViewID=${virtualView.virtualViewID}" })
  }

  // Called on ScrollView onLayout or onScroll
  public fun updateState() {
    debugLog("updateState")
    updateModes()
  }

  private fun updateModes(virtualView: VirtualView? = null) {
    scrollView.getDrawingRect(visibleRect)

    // This happens because ScrollView content isn't ready yet. The danger here is if ScrollView
    // intentionally goes but curently ScrollView and v1 Fling use this check to determine if
    // "content ready"
    if (visibleRect.isEmpty()) {
      debugLog("updateModes", { "scrollView visibleRect is empty" })
      return
    }

    prerenderRect.set(visibleRect)
    prerenderRect.inset(
        (-prerenderRect.width() * prerenderRatio).toInt(),
        (-prerenderRect.height() * prerenderRatio).toInt(),
    )

    val virtualViewsIt = if (virtualView != null) listOf(virtualView) else virtualViews
    virtualViewsIt.forEach { vv ->
      val rect = vv.containerRelativeRect

      var mode = VirtualViewMode.Hidden
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
        else -> {}
      }

      debugLog(
          "updateModes",
          { "virtualView=${vv.virtualViewID} mode=$mode  rect=$rect thresholdRect=$thresholdRect" },
      )
      vv.onModeChange(mode, thresholdRect)
    }
  }
}

private const val DEBUG_TAG: String = "VirtualViewContainerState"
private val IS_DEBUG_BUILD =
    ReactBuildConfig.DEBUG || ReactBuildConfig.IS_INTERNAL_BUILD || ReactBuildConfig.ENABLE_PERFETTO

internal inline fun debugLog(subtag: String, block: () -> String = { "" }) {
  if (IS_DEBUG_BUILD && ReactNativeFeatureFlags.enableVirtualViewDebugFeatures()) {
    FLog.d("$DEBUG_TAG:$subtag", block())
  }
}
