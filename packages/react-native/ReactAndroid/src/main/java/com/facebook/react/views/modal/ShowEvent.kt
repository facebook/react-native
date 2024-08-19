/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.Event

/** [Event] for showing a Dialog. */
internal class ShowEvent(surfaceId: Int, viewTag: Int) : Event<ShowEvent>(surfaceId, viewTag) {

  @Deprecated(
      "Do not use this constructor, use the one with explicit surfaceId",
      ReplaceWith("ShowEvent(surfaceId, viewTag)"))
  constructor(viewTag: Int) : this(ViewUtil.NO_SURFACE_ID, viewTag)

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap? = Arguments.createMap()

  companion object {
    const val EVENT_NAME: String = "topShow"
  }
}
