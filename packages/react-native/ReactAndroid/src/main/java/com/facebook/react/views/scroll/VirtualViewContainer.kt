/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.graphics.Rect
import android.view.ViewGroup
import com.facebook.common.logging.FLog
import com.facebook.react.common.build.ReactBuildConfig
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

internal class VirtualViewContainerState(private val scrollView: ViewGroup) :
    ReactScrollViewHelper.ScrollListener {

  private val prerenderRatio: Int = 1
  private val virtualViews: MutableSet<VirtualView> = mutableSetOf()
  private val emptyRect: Rect = Rect()
  private val visibleRect: Rect = Rect()
  private val prerenderRect: Rect = Rect()

  init {
    ReactScrollViewHelper.addScrollListener(this)
  }

  public fun add(virtualView: VirtualView) {
    assert(virtualViews.add(virtualView)) {
      "Attempting to add duplicate VirtualView: ${virtualView.virtualViewID}"
    }
    updateModes(virtualView)
  }

  public fun remove(virtualView: VirtualView) {
    assert(virtualViews.remove(virtualView)) {
      "Attempting to remove non-existent VirtualView: ${virtualView.virtualViewID}"
    }
  }

  // ReactScrollViewHelper.ScrollListener.onLayout
  // Emitted from ScrollView's onLayout
  override fun onLayout(scrollView: ViewGroup?) {
    // ReactScrollViewHelper is global
    if (this.scrollView == scrollView) {
      debugLog("ReactScrollViewHelper.onLayout")
      updateModes()
    }
  }

  // ReactScrollViewHelper.ScrollListener.onScroll
  // Emitted from ScrollView's onLayout
  override fun onScroll(
      scrollView: ViewGroup?,
      scrollEventType: ScrollEventType?,
      xVelocity: Float,
      yVelocity: Float
  ) {
    // ReactScrollViewHelper is global
    if (this.scrollView == scrollView) {
      debugLog("ReactScrollViewHelper.onScroll")
      updateModes()
    }
  }

  public fun update(virtualView: VirtualView) {
    updateModes(virtualView)
  }

  private fun updateModes(virtualView: VirtualView? = null) {
    scrollView.getDrawingRect(visibleRect)
    prerenderRect.set(visibleRect)
    prerenderRect.inset(
        (-prerenderRect.width() * prerenderRatio).toInt(),
        (-prerenderRect.height() * prerenderRatio).toInt())

    val virtualViewsIt = if (virtualView != null) listOf(virtualView) else virtualViews
    virtualViewsIt.forEach { vv ->
      val rect = vv.containerRelativeRect
      when {
        rectsOverlap(rect, visibleRect) -> {
          vv.onModeChange(VirtualViewMode.Visible, visibleRect)
        }
        rectsOverlap(rect, prerenderRect) -> {
          vv.onModeChange(VirtualViewMode.Prerender, prerenderRect)
        }
        else -> {
          vv.onModeChange(VirtualViewMode.Hidden, emptyRect)
        }
      }
    }
  }
}

private const val DEBUG_TAG: String = "VirtualViewContainerState"
private val IS_DEBUG_BUILD =
    ReactBuildConfig.DEBUG || ReactBuildConfig.IS_INTERNAL_BUILD || ReactBuildConfig.ENABLE_PERFETTO

internal inline fun debugLog(subtag: String, block: () -> String = { "" }) {
  if (IS_DEBUG_BUILD) {
    FLog.d("$DEBUG_TAG:$subtag", block())
  }
}
