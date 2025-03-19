/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events

import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.EventCategoryDef
import com.facebook.react.uimanager.events.RCTModernEventEmitter
import com.facebook.react.uimanager.events.TouchEvent
import com.facebook.systrace.Systrace

public class FabricEventEmitter(private val uiManager: FabricUIManager) : RCTModernEventEmitter {
  @Deprecated("Deprecated in Java")
  public override fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit {
    receiveEvent(ViewUtil.NO_SURFACE_ID, targetTag, eventName, params)
  }

  public override fun receiveEvent(
      surfaceId: Int,
      targetTag: Int,
      eventName: String,
      params: WritableMap?
  ) {
    receiveEvent(surfaceId, targetTag, eventName, false, 0, params, EventCategoryDef.UNSPECIFIED)
  }

  public override fun receiveEvent(
      surfaceId: Int,
      targetTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      customCoalesceKey: Int,
      params: WritableMap?,
      @EventCategoryDef category: Int
  ) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricEventEmitter.receiveEvent('$eventName')")
    try {
      uiManager.receiveEvent(surfaceId, targetTag, eventName, canCoalesceEvent, params, category)
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
    }
  }

  /** Touches are dispatched by [.receiveTouches] */
  @Deprecated("Deprecated in Java")
  public override fun receiveTouches(
      eventName: String,
      touches: WritableArray,
      changedIndices: WritableArray
  ): Unit {
    throw UnsupportedOperationException("EventEmitter#receiveTouches is not supported by Fabric")
  }

  @Deprecated("Deprecated in Java")
  public override fun receiveTouches(event: TouchEvent): Unit {
    // Calls are expected to go via TouchesHelper
    throw UnsupportedOperationException("EventEmitter#receiveTouches is not supported by Fabric")
  }
}
