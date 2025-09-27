/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/** Event emitted by EditText native view when text changes. */
internal class ReactTextChangedEvent(
    surfaceId: Int,
    viewId: Int,
    private val text: String,
    private val eventCount: Int,
) : Event<ReactTextChangedEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    return Arguments.createMap().apply {
      putString("text", text)
      putInt("eventCount", eventCount)
      putInt("target", viewTag)
    }
  }

  companion object {
    const val EVENT_NAME: String = "topChange"
  }
}
