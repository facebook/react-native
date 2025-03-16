/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import androidx.core.util.Pools.SynchronizedPool
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger.assertWhenLegacyArchitectureMinifyingEnabled
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.events.Event

/** Event used to notify JS component about changes of its position or dimensions. */
@LegacyArchitecture
public class OnLayoutEvent private constructor() :
  Event<OnLayoutEvent?>() {
  @VisibleForTesting
  public var mX: Int = 0

  @VisibleForTesting
  public var mY: Int = 0

  @VisibleForTesting
  public var mWidth: Int = 0

  @VisibleForTesting
  public var mHeight: Int = 0

  override fun onDispose() {
    EVENTS_POOL.release(this)
  }

  @Deprecated("")
  protected fun init(viewTag: Int, x: Int, y: Int, width: Int, height: Int) {
    init(-1, viewTag, x, y, width, height)
  }

  protected fun init(surfaceId: Int, viewTag: Int, x: Int, y: Int, width: Int, height: Int) {
    super.init(surfaceId, viewTag)
    mX = x
    mY = y
    mWidth = width
    mHeight = height
  }

  override fun getEventName(): String {
    return "topLayout"
  }

  override fun getEventData(): WritableMap? {
    val layout = Arguments.createMap().apply {
      putDouble("x", toDIPFromPixel(mX.toFloat()).toDouble())
      putDouble("y", toDIPFromPixel(mY.toFloat()).toDouble())
      putDouble("width", toDIPFromPixel(mWidth.toFloat()).toDouble())
      putDouble("height", toDIPFromPixel(mHeight.toFloat()).toDouble())
    }

    val event = Arguments.createMap().apply {
      putMap("layout", layout)
      putInt("target", viewTag)
    }

    return event
  }

  public companion object {
    init {
      assertWhenLegacyArchitectureMinifyingEnabled(
        "OnLayoutEvent", LegacyArchitectureLogLevel.WARNING
      )
    }

    private val EVENTS_POOL: SynchronizedPool<OnLayoutEvent> = SynchronizedPool<OnLayoutEvent>(20)

    @Deprecated("")
    public fun obtain(viewTag: Int, x: Int, y: Int, width: Int, height: Int): OnLayoutEvent {
      return obtain(-1, viewTag, x, y, width, height)
    }

    @JvmStatic
    public fun obtain(
        surfaceId: Int, viewTag: Int, x: Int, y: Int, width: Int, height: Int
    ): OnLayoutEvent {
      var event: OnLayoutEvent? = EVENTS_POOL.acquire()
      if (event == null) {
        event = OnLayoutEvent()
      }
      event.init(surfaceId, viewTag, x, y, width, height)
      return event
    }
  }
}
