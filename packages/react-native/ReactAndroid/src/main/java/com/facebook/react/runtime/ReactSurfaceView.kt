/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.runtime

import android.content.Context
import android.graphics.Point
import android.graphics.Rect
import android.view.MotionEvent
import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.systrace.Systrace
import java.util.Objects

/** A view created by [ReactSurface] that's responsible for rendering a React component. */
public class ReactSurfaceView(context: Context?, private val surface: ReactSurfaceImpl) :
    ReactRootView(context) {
  private val jsTouchDispatcher: JSTouchDispatcher = JSTouchDispatcher(this)
  private var jsPointerDispatcher: JSPointerDispatcher? = null
  private var wasMeasured = false
  private var widthMeasureSpec = 0
  private var heightMeasureSpec = 0

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      jsPointerDispatcher = JSPointerDispatcher(this)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactSurfaceView.onMeasure")
    var width = 0
    var height = 0
    val widthMode = MeasureSpec.getMode(widthMeasureSpec)
    if (widthMode == MeasureSpec.AT_MOST || widthMode == MeasureSpec.UNSPECIFIED) {
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        val childSize = (child.left + child.measuredWidth + child.paddingLeft + child.paddingRight)
        width = Math.max(width, childSize)
      }
    } else {
      width = MeasureSpec.getSize(widthMeasureSpec)
    }
    val heightMode = MeasureSpec.getMode(heightMeasureSpec)
    if (heightMode == MeasureSpec.AT_MOST || heightMode == MeasureSpec.UNSPECIFIED) {
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        val childSize = (child.top + child.measuredHeight + child.paddingTop + child.paddingBottom)
        height = Math.max(height, childSize)
      }
    } else {
      height = MeasureSpec.getSize(heightMeasureSpec)
    }
    setMeasuredDimension(width, height)
    wasMeasured = true
    this.widthMeasureSpec = widthMeasureSpec
    this.heightMeasureSpec = heightMeasureSpec
    val viewportOffset = viewportOffset
    surface.updateLayoutSpecs(
        widthMeasureSpec, heightMeasureSpec, viewportOffset.x, viewportOffset.y)
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // Call updateLayoutSpecs to update locationOnScreen offsets, in case they've changed
    if (wasMeasured && changed) {
      val viewportOffset = viewportOffset
      surface.updateLayoutSpecs(
          widthMeasureSpec, heightMeasureSpec, viewportOffset.x, viewportOffset.y)
    }
  }

  private val viewportOffset: Point
    get() {
      val locationOnScreen = IntArray(2)
      getLocationOnScreen(locationOnScreen)

      // we need to subtract visibleWindowCoords - to subtract possible window insets, split
      // screen or multi window
      val visibleWindowFrame = Rect()
      getWindowVisibleDisplayFrame(visibleWindowFrame)
      locationOnScreen[0] -= visibleWindowFrame.left
      locationOnScreen[1] -= visibleWindowFrame.top
      return Point(locationOnScreen[0], locationOnScreen[1])
    }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // Override in order to still receive events to onInterceptTouchEvent even when some other
    // views disallow that, but propagate it up the tree if possible.
    parent?.requestDisallowInterceptTouchEvent(disallowIntercept)
  }

  /**
   * Called when a child starts a native gesture (e.g. a scroll in a ScrollView). Should be called
   * from the child's onTouchIntercepted implementation.
   */
  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    val eventDispatcher = surface.eventDispatcher ?: return
    jsTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher)
    childView?.let { jsPointerDispatcher?.onChildStartedNativeGesture(it, ev, eventDispatcher) }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    val eventDispatcher = surface.eventDispatcher ?: return
    jsTouchDispatcher.onChildEndedNativeGesture(ev, eventDispatcher)
    jsPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun handleException(t: Throwable) {
    val reactHost = surface.reactHost
    val errorMessage = Objects.toString(t.message, "")
    val e: Exception = IllegalViewOperationException(errorMessage, this, t)
    reactHost.handleHostException(e)
  }

  override fun setIsFabric(isFabric: Boolean) {
    // This surface view is always on Fabric regardless.
    super.setIsFabric(true)
  }

  // This surface view is always on Fabric.
  @UIManagerType override fun getUIManagerType(): Int = UIManagerType.FABRIC

  override fun getJSModuleName(): String = surface.moduleName

  override fun dispatchJSTouchEvent(event: MotionEvent) {
    val eventDispatcher = surface.eventDispatcher
    if (eventDispatcher != null) {
      jsTouchDispatcher.handleTouchEvent(
          event, eventDispatcher, surface.reactHost.currentReactContext)
    } else {
      FLog.w(
          TAG, "Unable to dispatch touch events to JS as the React instance has not been attached")
    }
  }

  override fun dispatchJSPointerEvent(event: MotionEvent, isCapture: Boolean) {
    if (jsPointerDispatcher == null) {
      if (!ReactFeatureFlags.dispatchPointerEvents) {
        return
      }
      FLog.w(TAG, "Unable to dispatch pointer events to JS before the dispatcher is available")
      return
    }
    val eventDispatcher = surface.eventDispatcher
    if (eventDispatcher != null) {
      jsPointerDispatcher?.handleMotionEvent(event, eventDispatcher, isCapture)
    } else {
      FLog.w(
          TAG,
          "Unable to dispatch pointer events to JS as the React instance has not been attached")
    }
  }

  override fun hasActiveReactContext(): Boolean =
      surface.isAttached && surface.reactHost.currentReactContext != null

  override fun hasActiveReactInstance(): Boolean =
      surface.isAttached && surface.reactHost.isInstanceInitialized

  override fun getCurrentReactContext(): ReactContext? =
      if (surface.isAttached) {
        surface.reactHost.currentReactContext
      } else null

  override fun isViewAttachedToReactInstance(): Boolean = surface.isAttached

  private companion object {
    private const val TAG = "ReactSurfaceView"
  }
}
