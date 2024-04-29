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
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.uimanager.events.RCTModernEventEmitter

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

  override fun registerEventEmitter(uiManagerType: Int, eventEmitter: RCTEventEmitter) = Unit

  override fun registerEventEmitter(uiManagerType: Int, eventEmitter: RCTModernEventEmitter) = Unit

  override fun unregisterEventEmitter(uiManagerType: Int) = Unit

  override fun onCatalystInstanceDestroyed() = Unit
}
