/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.Event

/** Represents a Click on the ReactViewGroup */
public class ViewGroupClickEvent(surfaceId: Int, viewId: Int) :
    Event<ViewGroupClickEvent>(surfaceId, viewId) {

  @Deprecated("Use the constructor with surfaceId and viewId parameters.")
  public constructor(viewId: Int) : this(ViewUtil.NO_SURFACE_ID, viewId)

  override public fun getEventName(): String = EVENT_NAME

  override public fun canCoalesce(): Boolean = false

  override protected fun getEventData(): WritableMap = Arguments.createMap()

  private companion object {
    private const val EVENT_NAME: String = "topClick"
  }
}
