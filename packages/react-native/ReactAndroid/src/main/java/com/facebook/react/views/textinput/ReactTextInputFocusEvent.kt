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

/** Event emitted by EditText native view when it receives focus. */
internal class ReactTextInputFocusEvent(surfaceId: Int, viewId: Int) :
    Event<ReactTextInputFocusEvent>(surfaceId, viewId) {
  @Deprecated(
      "Use the constructor with surfaceId instead",
      ReplaceWith("ReactTextInputFocusEvent(surfaceId, viewId)"))
  constructor(viewId: Int) : this(ViewUtil.NO_SURFACE_ID, viewId)

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    return Arguments.createMap().apply { putInt("target", viewTag) }
  }

  override fun canCoalesce(): Boolean = false

  companion object {
    private const val EVENT_NAME = "topFocus"
  }
}
