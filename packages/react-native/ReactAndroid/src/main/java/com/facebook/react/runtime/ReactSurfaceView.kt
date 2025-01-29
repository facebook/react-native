/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.runtime

import android.content.Context
import com.facebook.common.logging.FLog
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.RootViewUtil
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.systrace.Systrace
import java.util.Objects

/** A view created by [ReactSurface] that's responsible for rendering a React component. */
public class ReactSurfaceView(context: Context?, private val surface: ReactSurfaceImpl) :
    ReactRootView(context) {
  private var wasMeasured = false
  private var widthMeasureSpec = 0
  private var heightMeasureSpec = 0

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
    val viewportOffset = RootViewUtil.getViewportOffset(this)
    surface.updateLayoutSpecs(
        widthMeasureSpec, heightMeasureSpec, viewportOffset.x, viewportOffset.y)
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // Call updateLayoutSpecs to update locationOnScreen offsets, in case they've changed
    if (wasMeasured && changed) {
      val viewportOffset = RootViewUtil.getViewportOffset(this)
      surface.updateLayoutSpecs(
          widthMeasureSpec, heightMeasureSpec, viewportOffset.x, viewportOffset.y)
    }
  }

  override fun getEventDispatcher(): EventDispatcher? {
    val eventDispatcher = surface.getEventDispatcher()
    if (eventDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch events to JS as the React instance has not been attached")
    }
    return eventDispatcher
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

  // TODO: incorporate D60594878

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
