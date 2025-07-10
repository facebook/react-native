/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtual.viewexperimental

import android.content.Context
import android.graphics.Rect
import android.view.View
import android.view.ViewParent
import androidx.annotation.VisibleForTesting
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.uimanager.ReactRoot
import com.facebook.react.views.scroll.VirtualView
import com.facebook.react.views.scroll.VirtualViewContainer
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.virtual.VirtualViewMode
import com.facebook.react.views.virtual.VirtualViewModeChangeEmitter
import com.facebook.react.views.virtual.VirtualViewRenderState

public class ReactVirtualViewExperimental(context: Context) :
    ReactViewGroup(context), VirtualView, View.OnLayoutChangeListener {

  internal var mode: VirtualViewMode? = null
  internal var modeChangeEmitter: VirtualViewModeChangeEmitter? = null
  internal var renderState: VirtualViewRenderState = VirtualViewRenderState.Unknown

  private var scrollView: VirtualViewContainer? = null
  override val containerRelativeRect: Rect = Rect()
  private var offsetX: Int = 0
  private var offsetY: Int = 0

  internal val nativeId: String?
    get() = getTag(R.id.view_tag_native_id) as? String

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    doAttachedToWindow()
  }

  @VisibleForTesting
  internal fun doAttachedToWindow() {
    // Assuming that layout has been called before this
    scrollView = getScrollView()?.also { scrollView?.virtualViewContainerState?.add(this) }
  }

  /** From [View#onLayout] */
  // This is when the view itself has layout changes
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (changed) {
      containerRelativeRect.set(
          left + offsetX,
          top + offsetY,
          right + offsetX,
          bottom + offsetY,
      )
      updateContainer()
    }
  }

  // Here we're subscribing to all parent views up to scrollView and when their layout changes
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
    if (oldLeft != left || oldTop != top) {
      val virtualViewScrollView = scrollView ?: return
      offsetX = 0
      offsetY = 0
      var parent: ViewParent? = parent
      while (parent != null && parent != virtualViewScrollView) {
        if (parent is View) {
          offsetX += parent.left
          offsetY += parent.top
        }
        parent = parent.parent
      }
      containerRelativeRect.set(
          left + offsetX,
          top + offsetY,
          right + offsetX,
          bottom + offsetY,
      )
      updateContainer()
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    recycleView()
  }

  override internal fun recycleView() {
    cleanupLayoutListeners()
    scrollView?.virtualViewContainerState?.remove(this)
    scrollView = null
    mode = null
    modeChangeEmitter = null
  }

  override val virtualViewID: String
    get() {
      return "${nativeId ?: "unknown"}:${id}"
    }

  override fun onModeChange(newMode: VirtualViewMode, thresholdRect: Rect) {
    if (newMode == mode) {
      return
    }

    val oldMode = mode
    mode = newMode

    debugLog("onModeChange") { "$oldMode->$newMode" }

    when (newMode) {
      VirtualViewMode.Visible -> {
        if (renderState == VirtualViewRenderState.Unknown) {
          // Feature flag is disabled, so use the former logic.
          modeChangeEmitter?.emitModeChange(
              VirtualViewMode.Visible, containerRelativeRect, thresholdRect, synchronous = true)
        } else {
          // If the previous mode was prerender and the result of dispatching that event was
          // committed, we do not need to dispatch an event for visible.
          val wasPrerenderCommitted =
              oldMode == VirtualViewMode.Prerender && renderState == VirtualViewRenderState.Rendered
          if (!wasPrerenderCommitted) {
            modeChangeEmitter?.emitModeChange(
                VirtualViewMode.Visible, containerRelativeRect, thresholdRect, synchronous = true)
          }
        }
      }
      VirtualViewMode.Prerender -> {
        if (oldMode != VirtualViewMode.Visible) {
          modeChangeEmitter?.emitModeChange(
              VirtualViewMode.Prerender, containerRelativeRect, thresholdRect, synchronous = false)
        }
      }
      VirtualViewMode.Hidden -> {
        modeChangeEmitter?.emitModeChange(
            VirtualViewMode.Hidden, containerRelativeRect, thresholdRect, synchronous = false)
      }
    }
  }

  private fun updateContainer() {
    scrollView?.virtualViewContainerState?.update(this)
  }

  private fun getScrollView(): VirtualViewContainer? = traverseParentStack(true)

  private fun cleanupLayoutListeners() {
    traverseParentStack(false)
  }

  private fun traverseParentStack(addListeners: Boolean): VirtualViewContainer? {
    var parent: ViewParent? = parent
    while (parent != null) {
      if (parent is VirtualViewContainer) {
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

  internal inline fun debugLog(subtag: String, block: () -> String = { "" }) {
    if (IS_DEBUG_BUILD) {
      FLog.d("$DEBUG_TAG:$subtag", "${block()} [$id][$nativeId]")
    }
  }
}

private const val DEBUG_TAG: String = "ReactVirtualViewExperimental"
private val IS_DEBUG_BUILD =
    ReactBuildConfig.DEBUG || ReactBuildConfig.IS_INTERNAL_BUILD || ReactBuildConfig.ENABLE_PERFETTO
