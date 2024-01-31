/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
@file:Suppress("DEPRECATION") // We want to use RCTEventEmitter for interop purposes

package com.facebook.react.views.popupmenu

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class PopupMenuSelectionEvent(surfaceId: Int, viewId: Int, val item: Int) :
    Event<PopupMenuSelectionEvent>(surfaceId, viewId) {

  override fun getEventName(): String {
    return EVENT_NAME
  }

  override fun getEventData(): WritableMap {
    val eventData: WritableMap = Arguments.createMap()
    eventData.putInt("target", viewTag)
    eventData.putDouble("item", item.toDouble())
    return eventData
  }

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, eventData)
  }

  companion object {
    const val EVENT_NAME: String = "topSelectionChange"
  }
}
