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

public class DrawerClosedEvent : Event<DrawerClosedEvent> {

  @Deprecated("Use constructor with surfaceId", ReplaceWith("DrawerClosedEvent(surfaceId, viewId)"))
  public constructor(viewId: Int) : this(ViewUtil.NO_SURFACE_ID, viewId)

  public constructor(surfaceId: Int, viewId: Int) : super(surfaceId, viewId)

  override public fun getEventName(): String = EVENT_NAME

  override protected fun getEventData(): WritableMap? = Arguments.createMap()

  public companion object {
    public const val EVENT_NAME: String = "topDrawerClose"
  }
}
