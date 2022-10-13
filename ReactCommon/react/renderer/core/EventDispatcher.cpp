/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventDispatcher.h"

#include <react/renderer/core/StateUpdate.h>

#include "BatchedEventQueue.h"
#include "RawEvent.h"
#include "UnbatchedEventQueue.h"

namespace facebook::react {

EventDispatcher::EventDispatcher(
    EventQueueProcessor const &eventProcessor,
    EventBeat::Factory const &synchonousEventBeatFactory,
    EventBeat::Factory const &asynchonousEventBeatFactory,
    EventBeat::SharedOwnerBox const &ownerBox)
    : synchronousUnbatchedQueue_(std::make_unique<UnbatchedEventQueue>(
          eventProcessor,
          synchonousEventBeatFactory(ownerBox))),
      synchronousBatchedQueue_(std::make_unique<BatchedEventQueue>(
          eventProcessor,
          synchonousEventBeatFactory(ownerBox))),
      asynchronousUnbatchedQueue_(std::make_unique<UnbatchedEventQueue>(
          eventProcessor,
          asynchonousEventBeatFactory(ownerBox))),
      asynchronousBatchedQueue_(std::make_unique<BatchedEventQueue>(
          eventProcessor,
          asynchonousEventBeatFactory(ownerBox))) {}

void EventDispatcher::dispatchEvent(RawEvent &&rawEvent, EventPriority priority)
    const {
  // Allows the event listener to interrupt default event dispatch
  if (eventListeners_.willDispatchEvent(rawEvent)) {
    return;
  }
  getEventQueue(priority).enqueueEvent(std::move(rawEvent));
}

void EventDispatcher::dispatchStateUpdate(
    StateUpdate &&stateUpdate,
    EventPriority priority) const {
  getEventQueue(priority).enqueueStateUpdate(std::move(stateUpdate));
}

void EventDispatcher::dispatchUniqueEvent(RawEvent &&rawEvent) const {
  // Allows the event listener to interrupt default event dispatch
  if (eventListeners_.willDispatchEvent(rawEvent)) {
    return;
  }
  asynchronousBatchedQueue_->enqueueUniqueEvent(std::move(rawEvent));
}

const EventQueue &EventDispatcher::getEventQueue(EventPriority priority) const {
  switch (priority) {
    case EventPriority::SynchronousUnbatched:
      return *synchronousUnbatchedQueue_;
    case EventPriority::SynchronousBatched:
      return *synchronousBatchedQueue_;
    case EventPriority::AsynchronousUnbatched:
      return *asynchronousUnbatchedQueue_;
    case EventPriority::AsynchronousBatched:
      return *asynchronousBatchedQueue_;
  }
}

void EventDispatcher::addListener(
    const std::shared_ptr<EventListener const> &listener) const {
  eventListeners_.addListener(listener);
}

/*
 * Removes provided event listener to the event dispatcher.
 */
void EventDispatcher::removeListener(
    const std::shared_ptr<EventListener const> &listener) const {
  eventListeners_.removeListener(listener);
}

} // namespace facebook::react
