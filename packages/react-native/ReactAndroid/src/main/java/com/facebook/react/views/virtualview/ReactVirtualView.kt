/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtualview

import android.content.Context
import android.graphics.Rect
import android.view.View
import android.view.ViewGroup
import android.view.ViewParent
import androidx.annotation.VisibleForTesting
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.ReactRoot
import com.facebook.react.views.scroll.ReactHorizontalScrollView
import com.facebook.react.views.scroll.ReactScrollView
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.facebook.react.views.scroll.ScrollEventType
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.systrace.Systrace

internal class ReactVirtualView(context: Context) :
    ReactViewGroup(context),
    ReactScrollViewHelper.ScrollListener,
    ReactScrollViewHelper.LayoutChangeListener,
    View.OnLayoutChangeListener {

  internal var mode: VirtualViewMode? = null
  internal var modeChangeEmitter: ModeChangeEmitter? = null
  internal var prerenderRatio: Double = ReactNativeFeatureFlags.virtualViewPrerenderRatio()
  internal val debugLogEnabled: Boolean = ReactNativeFeatureFlags.enableVirtualViewDebugFeatures()

  private var parentScrollView: View? = null

  // preallocate Rects to avoid allocation during layout
  private val lastRect: Rect = Rect()
  private val targetRect: Rect = Rect()
  private val thresholdRect: Rect = Rect()

  /** Cumulative offset of parents' `left` values within the scroll view */
  private var offsetX: Int = 0
  /** Cumulative offset of parents' `top` values within the scroll view */
  private var offsetY: Int = 0
  private var offsetChanged: Boolean = false

  internal val nativeId: String?
    get() = getTag(R.id.view_tag_native_id) as? String

  override internal fun recycleView() {
    ReactScrollViewHelper.removeScrollListener(this)
    ReactScrollViewHelper.removeLayoutChangeListener(this)
    cleanupLayoutListeners()
    mode = null
    modeChangeEmitter = null
    lastRect.setEmpty()
    parentScrollView = null
    offsetX = 0
    offsetY = 0
    offsetChanged = false
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    doAttachedToWindow()
  }

  @VisibleForTesting
  internal fun doAttachedToWindow() {
    parentScrollView =
        getParentScrollView()?.also {
          offsetChanged = true
          ReactScrollViewHelper.addScrollListener(this)
          ReactScrollViewHelper.addLayoutChangeListener(this)
        }
    debugLog("onAttachedToWindow")
    dispatchOnModeChangeIfNeeded(checkRectChange = false)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    ReactScrollViewHelper.removeScrollListener(this)
    ReactScrollViewHelper.removeLayoutChangeListener(this)
    cleanupLayoutListeners()
  }

  /** From [View#onLayout] */
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (changed) {
      offsetChanged = true
      dispatchOnModeChangeIfNeeded(checkRectChange = false)
    }
  }

  override fun onLayoutChange(
      v: View?,
      left: Int,
      top: Int,
      right: Int,
      bottom: Int,
      oldLeft: Int,
      oldTop: Int,
      oldRight: Int,
      oldBottom: Int
  ) {
    offsetChanged = offsetChanged || oldLeft != left || oldTop != top
    dispatchOnModeChangeIfNeeded(true)
  }

  /**
   * From ReactScrollViewHelper#onScroll, triggered by [ReactScrollView] and
   * [ReactHorizontalScrollView]
   */
  override fun onScroll(
      scrollView: ViewGroup?,
      scrollEventType: ScrollEventType?,
      xVelocity: Float,
      yVelocity: Float
  ) {
    if (scrollView == parentScrollView) {
      dispatchOnModeChangeIfNeeded(checkRectChange = false)
    }
  }

  /**
   * From ReactScrollViewHelper#onLayout, triggered by [ReactScrollView] and
   * [ReactHorizontalScrollView]
   */
  override fun onLayout(scrollView: ViewGroup?) {
    if (scrollView == parentScrollView) {
      dispatchOnModeChangeIfNeeded(checkRectChange = false)
    }
  }

  /**
   * From ReactScrollViewHelper#onLayoutChange, triggered by [ReactScrollView] and
   * [ReactHorizontalScrollView]
   */
  override fun onLayoutChange(scrollView: ViewGroup) {
    if (scrollView == parentScrollView) {
      offsetChanged = true
      dispatchOnModeChangeIfNeeded(false)
    }
  }

  private fun dispatchOnModeChangeIfNeeded(checkRectChange: Boolean) {
    modeChangeEmitter ?: return
    val scrollView = parentScrollView ?: return

    if (offsetChanged) {
      updateParentOffset()
    }
    targetRect.set(
        left + offsetX,
        top + offsetY,
        right + offsetX,
        bottom + offsetY,
    )
    scrollView.getDrawingRect(thresholdRect)

    // TODO: Validate whether this is still the case and whether these checks are still needed.
    // updateRects will initially get called before the targetRect has any dimensions set, so if
    // it's both zero width and height, we need to skip dispatching an incorrect mode change.
    // The correct mode change will be dispatched later. We can't use targetRect.isEmpty because it
    // will return true if either there's a zero width or height, but that case is valid.
    if ((targetRect.width() == 0 && targetRect.height() == 0) || thresholdRect.isEmpty) {
      debugLog("dispatchOnModeChangeIfNeeded") {
        "empty rects target=${targetRect.toShortString()} threshold=${thresholdRect.toShortString()}"
      }
      return
    }
    if (checkRectChange) {
      if (!lastRect.isEmpty && lastRect == targetRect) {
        debugLog("dispatchOnModeChangeIfNeeded") { "no rect change" }
        return
      }
      lastRect.set(targetRect)
    }

    val newMode: VirtualViewMode
    if (rectsOverlap(targetRect, thresholdRect)) {
      newMode = VirtualViewMode.Visible
    } else {
      var prerender = false
      if (prerenderRatio > 0.0) {
        thresholdRect.inset(
            (-thresholdRect.width() * prerenderRatio).toInt(),
            (-thresholdRect.height() * prerenderRatio).toInt())
        prerender = rectsOverlap(targetRect, thresholdRect)
      }
      if (prerender) {
        newMode = VirtualViewMode.Prerender
      } else {
        newMode = VirtualViewMode.Hidden
        thresholdRect.setEmpty()
      }
    }
    debugLog("dispatchOnModeChangeIfNeeded") {
      "mode=$mode target=${targetRect.toShortString()} threshold=${thresholdRect.toShortString()}"
    }

    if (newMode == mode) {
      return
    }
    val oldMode = mode
    mode = newMode
    maybeEmitModeChanges(oldMode, newMode)
  }

  /**
   * Checks whether one Rect overlaps with another Rect.
   *
   * This is different from [Rect.intersects] because a Rect representing a line or a point is
   * considered to overlap with another Rect if the line or point is within the rect bounds.
   * However, two Rects are not considered to overlap if they only share a boundary.
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

  /**
   * Evaluate the mode change and emit 0, 1, or 2 mode change events depending on the type of
   * transition, [noActivity], and [asyncPrerender]
   */
  private fun maybeEmitModeChanges(
      oldMode: VirtualViewMode?,
      newMode: VirtualViewMode,
  ) {
    debugLog("Mode change") { "$oldMode->$newMode" }
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT,
        "VirtualView::mode change $oldMode -> $newMode, nativeID=$nativeId")
    when (newMode) {
      VirtualViewMode.Visible -> {
        emitSyncModeChange(VirtualViewMode.Visible)
      }
      VirtualViewMode.Prerender -> {
        if (oldMode != VirtualViewMode.Visible) {
          emitAsyncModeChange(VirtualViewMode.Prerender)
        }
      }
      VirtualViewMode.Hidden -> {
        emitAsyncModeChange(VirtualViewMode.Hidden)
      }
    }
    Systrace.endSection(Systrace.TRACE_TAG_REACT)
  }

  private fun emitAsyncModeChange(mode: VirtualViewMode) {
    modeChangeEmitter?.emitModeChange(mode, targetRect, thresholdRect, synchronous = false)
  }

  private fun emitSyncModeChange(mode: VirtualViewMode) {
    modeChangeEmitter?.emitModeChange(mode, targetRect, thresholdRect, synchronous = true)
  }

  private fun getParentScrollView(): ViewGroup? = traverseParentStack(true)

  private fun cleanupLayoutListeners() {
    traverseParentStack(false)
  }

  /**
   * Navigate up through the view hierarchy until we reach the scroll view or root view, and
   * maintain layout change listeners on any intermediate views.
   *
   * @param addListeners Whether to call [View.addOnLayoutChangeListener] to views in the hierarchy.
   *   If false, existing listeners will be removed.
   */
  private fun traverseParentStack(addListeners: Boolean): ViewGroup? {
    var parent: ViewParent? = parent
    while (parent != null) {
      if (parent is ReactScrollView) {
        return parent
      }
      if (parent is ReactHorizontalScrollView) {
        return parent
      }
      if (parent is ReactRoot) {
        // don't look past the root - it could traverse into a separate hierarchy
        return null
      }
      if (parent is View) {
        // always remove, to ensure listeners aren't added more than once
        parent.removeOnLayoutChangeListener(this)
        if (addListeners) {
          parent.addOnLayoutChangeListener(this)
        }
      }
      parent = parent.parent
    }
    return null
  }

  /** Navigate up the view hierarchy to record parents' offsets within the scroll view */
  private fun updateParentOffset() {
    val scrollView = parentScrollView ?: return
    offsetX = 0
    offsetY = 0
    offsetChanged = false
    var parent: ViewParent? = parent
    while (parent != null && parent != scrollView) {
      if (parent is View) {
        offsetX += parent.left
        offsetY += parent.top
      }
      parent = parent.parent
    }
  }

  internal inline fun debugLog(subtag: String, block: () -> String = { "" }) {
    if (debugLogEnabled) {
      if (IS_DEBUG_BUILD) {
        FLog.d("$DEBUG_TAG:$subtag", "${block()} [$id][$nativeId]")
      } else {
        // production builds only log warnings/errors
        FLog.w("$DEBUG_TAG:$subtag", "${block()} [$id][$nativeId]")
      }
    }
  }
}

internal fun interface ModeChangeEmitter {
  fun emitModeChange(
      mode: VirtualViewMode,
      targetRect: Rect,
      thresholdRect: Rect,
      synchronous: Boolean,
  )
}

private const val DEBUG_TAG: String = "ReactVirtualView"

private val IS_DEBUG_BUILD =
    ReactBuildConfig.DEBUG || ReactBuildConfig.IS_INTERNAL_BUILD || ReactBuildConfig.ENABLE_PERFETTO
