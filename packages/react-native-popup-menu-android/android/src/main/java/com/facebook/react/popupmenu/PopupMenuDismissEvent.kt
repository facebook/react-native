/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Deprecated usage inc imports of RCTEventEmitter
@file:Suppress("DEPRECATION")

package com.facebook.react.popupmenu

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

public class PopupMenuDismissEvent(surfaceId: Int, viewId: Int) :
    Event<PopupMenuDismissEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap? = null

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, eventData)
  }

  public companion object {
    public const val EVENT_NAME: String = "topPopupDismiss"
  }
}
