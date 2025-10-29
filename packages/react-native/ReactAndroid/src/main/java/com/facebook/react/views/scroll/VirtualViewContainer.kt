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
internal fun rectsOverlap(rect1: Rect, rect2: Rect): Boolean {
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

internal abstract class VirtualViewContainerState {
  protected val prerenderRatio: Double = ReactNativeFeatureFlags.virtualViewPrerenderRatio()
  protected val hysteresisRatio: Double = ReactNativeFeatureFlags.virtualViewHysteresisRatio()
  protected abstract val virtualViews: MutableCollection<VirtualView>
  protected val emptyRect: Rect = Rect()
  protected val visibleRect: Rect = Rect()
  protected val prerenderRect: Rect = Rect()
  protected val hysteresisRect: Rect = Rect()
  protected val onWindowFocusChangeListener =
      if (ReactNativeFeatureFlags.enableVirtualViewWindowFocusDetection()) {
        ViewTreeObserver.OnWindowFocusChangeListener {
          debugLog("onWindowFocusChanged")
          updateModes()
        }
      } else {
        null
      }
  protected val scrollView: ViewGroup

  companion object {
    @JvmStatic
    fun create(scrollView: ViewGroup): VirtualViewContainerState {
      return if (ReactNativeFeatureFlags.enableVirtualViewContainerStateExperimental()) {
        VirtualViewContainerStateExperimental(scrollView)
      } else {
        VirtualViewContainerStateClassic(scrollView)
      }
    }
  }

  constructor(scrollView: ViewGroup) {
    this.scrollView = scrollView
    if (onWindowFocusChangeListener != null) {
      scrollView.viewTreeObserver.addOnWindowFocusChangeListener(onWindowFocusChangeListener)
    }
  }

  fun cleanup() {
    if (onWindowFocusChangeListener != null) {
      scrollView.viewTreeObserver.removeOnWindowFocusChangeListener(onWindowFocusChangeListener)
    }
  }

  open fun onChange(virtualView: VirtualView) {
    if (virtualViews.add(virtualView)) {
      debugLog("add", { "virtualViewID=${virtualView.virtualViewID}" })
    } else {
      debugLog("update", { "virtualViewID=${virtualView.virtualViewID}" })
    }
    updateModes(virtualView)
  }

  open fun remove(virtualView: VirtualView) {
    assert(virtualViews.remove(virtualView)) {
      "Attempting to remove non-existent VirtualView: ${virtualView.virtualViewID}"
    }
    debugLog("remove", { "virtualViewID=${virtualView.virtualViewID}" })
  }

  // Called on ScrollView onLayout or onScroll
  fun updateState() {
    debugLog("updateState")
    updateModes()
  }

  /**
   * Refreshes the coordinates for the Rects this class cares about (visibleRect, prerenderRect,
   * hysteresisRect)
   */
  protected fun updateRects() {
    scrollView.getDrawingRect(visibleRect)

    // This happens because ScrollView content isn't ready yet. The danger here is if ScrollView
    // intentionally goes but curently ScrollView and v1 Fling use this check to determine if
    // "content ready"
    if (visibleRect.isEmpty()) {
      debugLog("updateRects", { "scrollView visibleRect is empty" })
      // should set the other rects here in case scrollview is suddenly empty after the other rects
      // are non-empty
      prerenderRect.set(visibleRect)
      hysteresisRect.set(prerenderRect)
      return
    }

    prerenderRect.set(visibleRect)
    prerenderRect.inset(
        (-prerenderRect.width() * prerenderRatio).toInt(),
        (-prerenderRect.height() * prerenderRatio).toInt(),
    )

    hysteresisRect.set(prerenderRect)
    hysteresisRect.inset(
        (-visibleRect.width() * hysteresisRatio).toInt(),
        (-visibleRect.height() * hysteresisRatio).toInt(),
    )

    debugLog(
        "updateRects",
        {
          "visibleRect ${visibleRect.toString()} prerenderRect ${prerenderRect.toString()} hysteresisRect ${hysteresisRect.toString()}"
        },
    )
  }

  protected abstract fun updateModes(virtualView: VirtualView? = null)
}

private const val DEBUG_TAG: String = "VirtualViewContainerState"
internal val IS_DEBUG_BUILD =
    ReactBuildConfig.DEBUG || ReactBuildConfig.IS_INTERNAL_BUILD || ReactBuildConfig.ENABLE_PERFETTO

private inline fun debugLog(subtag: String, block: () -> String = { "" }) {
  if (IS_DEBUG_BUILD && ReactNativeFeatureFlags.enableVirtualViewDebugFeatures()) {
    FLog.d("$DEBUG_TAG:$subtag", block())
  }
}
