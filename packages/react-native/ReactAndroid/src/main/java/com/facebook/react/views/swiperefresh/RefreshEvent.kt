/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.swiperefresh

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.Event

internal class RefreshEvent : Event<RefreshEvent> {

  @Deprecated("Use constructor with surfaceId", ReplaceWith("RefreshEvent(surfaceId, viewTag)"))
  constructor(viewTag: Int) : this(ViewUtil.NO_SURFACE_ID, viewTag)

  constructor(surfaceId: Int, viewTag: Int) : super(surfaceId, viewTag)

  override fun getEventName(): String {
    return "topRefresh"
  }

  override fun getEventData(): WritableMap {
    return Arguments.createMap()
  }
}
