/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.os.SystemClock
import androidx.core.util.Pools.SynchronizedPool
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.Event

/** A event dispatched from a ScrollView scrolling. */
public class ScrollEvent private constructor() : Event<ScrollEvent>() {
  private var scrollX = 0f
  private var scrollY = 0f
  private var xVelocity = 0f
  private var yVelocity = 0f
  private var contentWidth = 0
  private var contentHeight = 0
  private var scrollViewWidth = 0
  private var scrollViewHeight = 0
  private var scrollEventType: ScrollEventType? = null
  private var timestamp: Long = 0

  override fun onDispose() {
    try {
      EVENTS_POOL.release(this)
    } catch (e: IllegalStateException) {
      // This exception can be thrown when an event is double-released.
      // This is a problem but won't cause user-visible impact, so it's okay to fail silently.
      ReactSoftExceptionLogger.logSoftException(TAG, e)
    }
  }

  private fun init(
      surfaceId: Int,
      viewTag: Int,
      scrollEventType: ScrollEventType?,
      scrollX: Float,
      scrollY: Float,
      xVelocity: Float,
      yVelocity: Float,
      contentWidth: Int,
      contentHeight: Int,
      scrollViewWidth: Int,
      scrollViewHeight: Int,
  ) {
    super.init(surfaceId, viewTag)
    this.scrollEventType = scrollEventType
    this.scrollX = scrollX
    this.scrollY = scrollY
    this.xVelocity = xVelocity
    this.yVelocity = yVelocity
    this.contentWidth = contentWidth
    this.contentHeight = contentHeight
    this.scrollViewWidth = scrollViewWidth
    this.scrollViewHeight = scrollViewHeight
    this.timestamp = SystemClock.uptimeMillis()
  }

  override fun getEventName(): String =
      ScrollEventType.getJSEventName(Assertions.assertNotNull(scrollEventType))

  override fun canCoalesce(): Boolean = scrollEventType == ScrollEventType.SCROLL

  override fun getEventData(): WritableMap {
    val contentInset = Arguments.createMap()
    contentInset.putDouble("top", 0.0)
    contentInset.putDouble("bottom", 0.0)
    contentInset.putDouble("left", 0.0)
    contentInset.putDouble("right", 0.0)
    val contentOffset = Arguments.createMap()
    contentOffset.putDouble("x", toDIPFromPixel(scrollX).toDouble())
    contentOffset.putDouble("y", toDIPFromPixel(scrollY).toDouble())
    val contentSize = Arguments.createMap()
    contentSize.putDouble("width", toDIPFromPixel(contentWidth.toFloat()).toDouble())
    contentSize.putDouble("height", toDIPFromPixel(contentHeight.toFloat()).toDouble())
    val layoutMeasurement = Arguments.createMap()
    layoutMeasurement.putDouble("width", toDIPFromPixel(scrollViewWidth.toFloat()).toDouble())
    layoutMeasurement.putDouble("height", toDIPFromPixel(scrollViewHeight.toFloat()).toDouble())
    val velocity = Arguments.createMap()
    velocity.putDouble("x", xVelocity.toDouble())
    velocity.putDouble("y", yVelocity.toDouble())
    val event = Arguments.createMap()
    event.putMap("contentInset", contentInset)
    event.putMap("contentOffset", contentOffset)
    event.putMap("contentSize", contentSize)
    event.putMap("layoutMeasurement", layoutMeasurement)
    event.putMap("velocity", velocity)
    event.putInt("target", viewTag)
    event.putDouble("timestamp", timestamp.toDouble())
    event.putBoolean("responderIgnoreScroll", true)
    return event
  }

  public companion object {
    private val TAG = ScrollEvent::class.java.simpleName
    private val EVENTS_POOL = SynchronizedPool<ScrollEvent>(3)

    @JvmStatic
    public fun obtain(
        surfaceId: Int,
        viewTag: Int,
        scrollEventType: ScrollEventType?,
        scrollX: Float,
        scrollY: Float,
        xVelocity: Float,
        yVelocity: Float,
        contentWidth: Int,
        contentHeight: Int,
        scrollViewWidth: Int,
        scrollViewHeight: Int,
    ): ScrollEvent =
        (EVENTS_POOL.acquire() ?: ScrollEvent()).apply {
          init(
              surfaceId,
              viewTag,
              scrollEventType,
              scrollX,
              scrollY,
              xVelocity,
              yVelocity,
              contentWidth,
              contentHeight,
              scrollViewWidth,
              scrollViewHeight)
        }

    @Deprecated(
        "Use the obtain version that explicitly takes surfaceId as an argument",
        ReplaceWith(
            "obtain(surfaceId, viewTag, scrollEventType, scrollX, scrollY, xVelocity, yVelocity, contentWidth, contentHeight, scrollViewWidth, scrollViewHeight)"))
    @JvmStatic
    public fun obtain(
        viewTag: Int,
        scrollEventType: ScrollEventType?,
        scrollX: Float,
        scrollY: Float,
        xVelocity: Float,
        yVelocity: Float,
        contentWidth: Int,
        contentHeight: Int,
        scrollViewWidth: Int,
        scrollViewHeight: Int
    ): ScrollEvent =
        obtain(
            ViewUtil.NO_SURFACE_ID,
            viewTag,
            scrollEventType,
            scrollX,
            scrollY,
            xVelocity,
            yVelocity,
            contentWidth,
            contentHeight,
            scrollViewWidth,
            scrollViewHeight,
        )
  }
}
