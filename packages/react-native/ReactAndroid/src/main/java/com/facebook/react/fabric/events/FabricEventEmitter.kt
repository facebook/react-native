/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events

import com.facebook.react.bridge.WritableMap
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.uimanager.events.EventCategoryDef
import com.facebook.react.uimanager.events.RCTModernEventEmitter
import com.facebook.systrace.Systrace

internal class FabricEventEmitter(private val uiManager: FabricUIManager) : RCTModernEventEmitter {
  override fun receiveEvent(
      surfaceId: Int,
      targetTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      customCoalesceKey: Int,
      params: WritableMap?,
      @EventCategoryDef category: Int,
  ) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "FabricEventEmitter.receiveEvent('$eventName')")
    try {
      uiManager.receiveEvent(surfaceId, targetTag, eventName, canCoalesceEvent, params, category)
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
  }
}
