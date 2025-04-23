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

public class DrawerStateChangedEvent : Event<DrawerStateChangedEvent> {

  private val drawerState: Int

  @Deprecated(
      "Use constructor with surfaceId",
      ReplaceWith("DrawerStateChangedEvent(surfaceId, viewId, drawerState)"))
  public constructor(
      viewId: Int,
      drawerState: Int
  ) : this(ViewUtil.NO_SURFACE_ID, viewId, drawerState)

  public constructor(surfaceId: Int, viewId: Int, drawerState: Int) : super(surfaceId, viewId) {
    this.drawerState = drawerState
  }

  public fun getDrawerState(): Int = drawerState

  public override fun getEventName(): String = EVENT_NAME

  protected override fun getEventData(): WritableMap? {
    val eventData: WritableMap = Arguments.createMap()
    eventData.putInt("drawerState", getDrawerState())
    return eventData
  }

  public companion object {
    public const val EVENT_NAME: String = "topDrawerStateChanged"
  }
}
