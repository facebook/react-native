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

/** Event emitted by EditText native view when key pressed. */
internal class ReactTextInputKeyPressEvent(surfaceId: Int, viewId: Int, private val key: String) :
    Event<ReactTextInputKeyPressEvent>(surfaceId, viewId) {
  @Deprecated(
      "Use the constructor with surfaceId instead",
      ReplaceWith("ReactTextInputKeyPressEvent(surfaceId, viewId, key)"))
  constructor(viewId: Int, key: String) : this(ViewUtil.NO_SURFACE_ID, viewId, key)

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    return Arguments.createMap().apply { putString("key", key) }
  }

  // We don't want to miss any textinput event, as event data is incremental.
  override fun canCoalesce(): Boolean = false

  companion object {
    const val EVENT_NAME: String = "topKeyPress"
  }
}
