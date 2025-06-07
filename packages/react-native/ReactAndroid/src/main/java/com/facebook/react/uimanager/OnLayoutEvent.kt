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
import com.facebook.react.bridge.buildReadableMap
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.events.Event

/** Event used to notify JS component about changes of its position or dimensions. */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
public class OnLayoutEvent private constructor() : Event<OnLayoutEvent>() {
  @VisibleForTesting internal var x: Int = 0
  @VisibleForTesting internal var y: Int = 0
  @VisibleForTesting internal var width: Int = 0
  @VisibleForTesting internal var height: Int = 0

  override fun onDispose() {
    EVENTS_POOL.release(this)
  }

  protected fun init(surfaceId: Int, viewTag: Int, x: Int, y: Int, width: Int, height: Int) {
    super.init(surfaceId, viewTag)
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  override fun getEventName(): String = "topLayout"

  override fun getEventData(): WritableMap {
    val layout = buildReadableMap {
      put("x", toDIPFromPixel(x.toFloat()).toDouble())
      put("y", toDIPFromPixel(y.toFloat()).toDouble())
      put("width", toDIPFromPixel(width.toFloat()).toDouble())
      put("height", toDIPFromPixel(height.toFloat()).toDouble())
    }

    val event =
        Arguments.createMap().apply {
          putMap("layout", layout)
          putInt("target", viewTag)
        }

    return event
  }

  public companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "OnLayoutEvent", LegacyArchitectureLogLevel.ERROR)
    }

    private val EVENTS_POOL: SynchronizedPool<OnLayoutEvent> = SynchronizedPool<OnLayoutEvent>(20)

    @Deprecated(
        "Use `obtain(surfaceId, viewTag, x, y, width, height)` instead.",
        ReplaceWith("obtain(surfaceId, viewTag, x, y, width, height)"))
    @JvmStatic
    public fun obtain(viewTag: Int, x: Int, y: Int, width: Int, height: Int): OnLayoutEvent {
      return obtain(-1, viewTag, x, y, width, height)
    }

    @JvmStatic
    public fun obtain(
        surfaceId: Int,
        viewTag: Int,
        x: Int,
        y: Int,
        width: Int,
        height: Int
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
