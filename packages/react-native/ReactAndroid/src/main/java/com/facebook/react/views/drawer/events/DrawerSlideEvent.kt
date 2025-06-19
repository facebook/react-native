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
internal class DrawerSlideEvent : Event<DrawerSlideEvent> {

  private val offset: Float

  @Deprecated(
      "Use constructor with surfaceId", ReplaceWith("DrawerSlideEvent(surfaceId, viewId, offset)"))
  constructor(viewId: Int, offset: Float) : this(ViewUtil.NO_SURFACE_ID, viewId, offset)

  constructor(surfaceId: Int, viewId: Int, offset: Float) : super(surfaceId, viewId) {
    this.offset = offset
  }

  fun getOffset(): Float = offset

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    val eventData: WritableMap = Arguments.createMap()
    eventData.putDouble("offset", getOffset().toDouble())
    return eventData
  }

  companion object {
    const val EVENT_NAME: String = "topDrawerSlide"
  }
}
