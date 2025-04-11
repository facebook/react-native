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
internal object BlackHoleEventDispatcher : EventDispatcher {
  override fun dispatchEvent(event: Event<*>) {
    FLog.d(
        "BlackHoleEventDispatcher",
        "Trying to emit event to JS, but the React instance isn't ready. Event: ${event.getEventName()}")
  }

  override fun dispatchAllEvents(): Unit = Unit

  override fun addListener(listener: EventDispatcherListener): Unit = Unit

  override fun removeListener(listener: EventDispatcherListener): Unit = Unit

  override fun addBatchEventDispatchedListener(listener: BatchEventDispatchedListener): Unit = Unit

  override fun removeBatchEventDispatchedListener(listener: BatchEventDispatchedListener): Unit =
      Unit

  @Deprecated("Private API, should only be used when the concrete implementation is known.")
  override fun onCatalystInstanceDestroyed(): Unit = Unit
}
