/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// RCTEventEmitter usage throughout:
@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager.events

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil.getUIManagerType

/**
 * This class handles event emitting across the legacy and Fabric event emitting mechanisms. Based
 * on the surfaceId and targetTag, it will route the event to the appropriate event emitter.
 *
 * This class is constructed both by Paper's EventDispatcherImpl and the FabricEventDispatcher.
 */
internal class ReactEventEmitter(private val reactContext: ReactApplicationContext) :
    RCTModernEventEmitter {
  /** Corresponds to [com.facebook.react.fabric.events.FabricEventEmitter] */
  private var fabricEventEmitter: RCTModernEventEmitter? = null

  /** Corresponds to (Paper) EventEmitter, which is a JS interface */
  private var defaultEventEmitter: RCTEventEmitter? = null

  fun register(@UIManagerType uiManagerType: Int, eventEmitter: RCTModernEventEmitter?) {
    check(uiManagerType == UIManagerType.FABRIC)
    fabricEventEmitter = eventEmitter
  }

  fun register(@UIManagerType uiManagerType: Int, eventEmitter: RCTEventEmitter?) {
    check(uiManagerType == UIManagerType.LEGACY)
    defaultEventEmitter = eventEmitter
  }

  fun unregister(@UIManagerType uiManagerType: Int) {
    if (uiManagerType == UIManagerType.LEGACY) {
      defaultEventEmitter = null
    } else {
      fabricEventEmitter = null
    }
  }

  @Deprecated("Please use RCTModernEventEmitter")
  override fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?) {
    receiveEvent(-1, targetTag, eventName, params)
  }

  override fun receiveEvent(
      surfaceId: Int,
      targetTag: Int,
      eventName: String,
      params: WritableMap?
  ) {
    // We assume this event can't be coalesced. `customCoalesceKey` has no meaning in Fabric.
    receiveEvent(surfaceId, targetTag, eventName, false, 0, params, EventCategoryDef.UNSPECIFIED)
  }

  /*
   * This method should be unused by Fabric event processing pipeline, but leaving it here to make sure
   * that any custom code using it in legacy renderer is compatible
   */
  @Deprecated("Dispatch the TouchEvent using [EventDispatcher] instead")
  override fun receiveTouches(
      eventName: String,
      touches: WritableArray,
      changedIndices: WritableArray
  ) {
    check(touches.size() > 0)
    val reactTag = touches.getMap(0)?.getInt(TouchesHelper.TARGET_KEY) ?: 0
    @UIManagerType val uiManagerType = getUIManagerType(reactTag)
    if (uiManagerType == UIManagerType.LEGACY) {
      ensureDefaultEventEmitter()?.receiveTouches(eventName, touches, changedIndices)
    }
  }

  /**
   * Get default/Paper event emitter. Callers should have verified that this is not an event for a
   * View managed by Fabric
   */
  private fun ensureDefaultEventEmitter(): RCTEventEmitter? {
    if (defaultEventEmitter == null) {
      if (reactContext.hasActiveReactInstance()) {
        defaultEventEmitter = reactContext.getJSModule(RCTEventEmitter::class.java)
      } else {
        logSoftException(
            TAG,
            ReactNoCrashSoftException(
                "Cannot get RCTEventEmitter from Context, no active Catalyst instance!"))
      }
    }
    return defaultEventEmitter
  }

  override fun receiveEvent(
      surfaceId: Int,
      targetTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      customCoalesceKey: Int,
      params: WritableMap?,
      @EventCategoryDef category: Int
  ) {
    @UIManagerType val uiManagerType = getUIManagerType(targetTag, surfaceId)
    if (uiManagerType == UIManagerType.FABRIC) {
      fabricEventEmitter?.receiveEvent(
          surfaceId, targetTag, eventName, canCoalesceEvent, customCoalesceKey, params, category)
    } else if (uiManagerType == UIManagerType.LEGACY) {
      ensureDefaultEventEmitter()?.receiveEvent(targetTag, eventName, params)
    }
  }

  companion object {
    private const val TAG = "ReactEventEmitter"
  }
}
