/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.drawer.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.Event

/** Event emitted by a DrawerLayout as it is being moved open/closed. */
public class DrawerSlideEvent : Event<DrawerSlideEvent> {

  private val offset: Float

  @Deprecated(
      "Use constructor with surfaceId", ReplaceWith("DrawerSlideEvent(surfaceId, viewId, offset)"))
  public constructor(viewId: Int, offset: Float) : this(ViewUtil.NO_SURFACE_ID, viewId, offset)

  public constructor(surfaceId: Int, viewId: Int, offset: Float) : super(surfaceId, viewId) {
    this.offset = offset
  }

  public fun getOffset(): Float = offset

  override public fun getEventName(): String = EVENT_NAME

  override protected fun getEventData(): WritableMap? {
    val eventData: WritableMap = Arguments.createMap()
    eventData.putDouble("offset", getOffset().toDouble())
    return eventData
  }

  public companion object {
    public const val EVENT_NAME: String = "topDrawerSlide"
  }
}
