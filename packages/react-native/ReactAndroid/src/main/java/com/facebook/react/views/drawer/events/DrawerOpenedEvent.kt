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

internal class DrawerOpenedEvent : Event<DrawerOpenedEvent> {

  @Deprecated("Use constructor with surfaceId", ReplaceWith("DrawerOpenedEvent(surfaceId, viewId)"))
  constructor(viewId: Int) : this(ViewUtil.NO_SURFACE_ID, viewId)

  constructor(surfaceId: Int, viewId: Int) : super(surfaceId, viewId)

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME: String = "topDrawerOpen"
  }
}
