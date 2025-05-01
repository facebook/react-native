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

/** Event emitted by EditText native view when the text selection changes. */
internal class ReactTextInputSelectionEvent(
    surfaceId: Int,
    viewId: Int,
    private val selectionStart: Int,
    private val selectionEnd: Int
) : Event<ReactTextInputSelectionEvent>(surfaceId, viewId) {
  @Deprecated(
      "Use the constructor with surfaceId instead",
      ReplaceWith("ReactTextInputSelectionEvent(surfaceId, viewId, selectionStart, selectionEnd)"))
  constructor(
      viewId: Int,
      selectionStart: Int,
      selectionEnd: Int
  ) : this(ViewUtil.NO_SURFACE_ID, viewId, selectionStart, selectionEnd)

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    val selectionData =
        Arguments.createMap().apply {
          putInt("end", selectionEnd)
          putInt("start", selectionStart)
        }

    return Arguments.createMap().apply { putMap("selection", selectionData) }
  }

  companion object {
    private const val EVENT_NAME = "topSelectionChange"
  }
}
