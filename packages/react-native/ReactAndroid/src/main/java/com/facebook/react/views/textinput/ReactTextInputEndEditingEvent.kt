/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.Event

/**
 * Event emitted by EditText native view when text editing ends, because of the user leaving the
 * text input.
 */
internal class ReactTextInputEndEditingEvent(
    surfaceId: Int,
    viewId: Int,
    private val text: String
) : Event<ReactTextInputEndEditingEvent>(surfaceId, viewId) {
  @Deprecated(
      "Use the constructor with surfaceId instead",
      ReplaceWith("ReactTextInputEndEditingEvent(surfaceId, viewId, text)"))
  constructor(viewId: Int, text: String) : this(ViewUtil.NO_SURFACE_ID, viewId, text)

  override fun getEventName(): String = EVENT_NAME

  override fun canCoalesce(): Boolean = false

  override fun getEventData(): WritableMap {
    return Arguments.createMap().apply {
      putInt("target", viewTag)
      putString("text", text)
    }
  }

  companion object {
    private const val EVENT_NAME = "topEndEditing"
  }
}
