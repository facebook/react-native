/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.interop

import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.internal.InteropLegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.uimanager.events.Event

/**
 * An [Event] class used by the [InteropEventEmitter]. This class is just holding the event name and
 * the data which is received by the `receiveEvent` method and will be passed over the the
 * [com.facebook.react.uimanager.events.EventDispatcher]
 */
@InteropLegacyArchitecture
internal class InteropEvent(
    @get:JvmName("eventName") val interopEventName: String,
    @get:JvmName("eventData") val eventData: WritableMap?,
    surfaceId: Int,
    viewTag: Int
) : Event<InteropEvent>(surfaceId, viewTag) {

  override fun getEventName(): String = interopEventName

  override fun getEventData(): WritableMap? = eventData

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture("InteropEvent")
    }
  }
}
