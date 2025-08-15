/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // Suppressing as RCTEventEmitter is part of the API

package com.facebook.testutils.fakes

import com.facebook.react.uimanager.events.BatchEventDispatchedListener
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.EventDispatcherListener

@SuppressWarnings("rawtypes")
class FakeEventDispatcher : EventDispatcher {
  private val recordedDispatchedEvents = mutableListOf<Event<*>>()

  fun getRecordedDispatchedEvents(): List<Event<*>> {
    return recordedDispatchedEvents
  }

  override fun dispatchEvent(event: Event<*>) {
    recordedDispatchedEvents.add(event)
  }

  override fun dispatchAllEvents() = Unit

  override fun addListener(listener: EventDispatcherListener) = Unit

  override fun removeListener(listener: EventDispatcherListener) = Unit

  override fun addBatchEventDispatchedListener(listener: BatchEventDispatchedListener) = Unit

  override fun removeBatchEventDispatchedListener(listener: BatchEventDispatchedListener) = Unit

  @Deprecated("Private API, should only be used when the concrete implementation is known.")
  override fun onCatalystInstanceDestroyed() = Unit
}
