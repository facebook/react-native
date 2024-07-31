/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import com.facebook.common.logging.FLog

/**
 * A singleton class that overrides [EventDispatcher] with no-op methods, to be used by callers that
 * expect an EventDispatcher when the instance doesn't exist.
 */
public class BlackHoleEventDispatcher private constructor() : EventDispatcher {
  public override fun dispatchEvent(event: Event<*>) {
    FLog.d(
        "BlackHoleEventDispatcher",
        "Trying to emit event to JS, but the React instance isn't ready. Event: ${event.eventName}")
  }

  public override fun dispatchAllEvents(): Unit = Unit

  public override fun addListener(listener: EventDispatcherListener): Unit = Unit

  public override fun removeListener(listener: EventDispatcherListener): Unit = Unit

  public override fun addBatchEventDispatchedListener(
      listener: BatchEventDispatchedListener
  ): Unit = Unit

  public override fun removeBatchEventDispatchedListener(
      listener: BatchEventDispatchedListener
  ): Unit = Unit

  @Suppress("DEPRECATION")
  public override fun registerEventEmitter(
      uiManagerType: Int,
      eventEmitter: RCTEventEmitter
  ): Unit = Unit

  public override fun registerEventEmitter(
      uiManagerType: Int,
      eventEmitter: RCTModernEventEmitter
  ): Unit = Unit

  public override fun unregisterEventEmitter(uiManagerType: Int): Unit = Unit

  public override fun onCatalystInstanceDestroyed(): Unit = Unit

  public companion object {
    private val eventDispatcher: EventDispatcher = BlackHoleEventDispatcher()

    public @JvmStatic fun get(): EventDispatcher = eventDispatcher
  }
}
