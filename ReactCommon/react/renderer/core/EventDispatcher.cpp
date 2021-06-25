/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventDispatcher.h"

#include <react/renderer/core/StateUpdate.h>

#include "BatchedEventQueue.h"
#include "RawEvent.h"
#include "UnbatchedEventQueue.h"

namespace facebook {
namespace react {

EventDispatcher::EventDispatcher(
    EventQueueProcessor eventProcessor,
    EventBeat::Factory const &synchonousEventBeatFactory,
    EventBeat::Factory const &asynchonousEventBeatFactory,
    EventBeat::SharedOwnerBox const &ownerBox,
    bool unbatchedQueuesOnly)
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
          asynchonousEventBeatFactory(ownerBox))),
      unbatchedQueuesOnly_(unbatchedQueuesOnly) {}

void EventDispatcher::dispatchEvent(RawEvent &&rawEvent, EventPriority priority)
    const {
  getEventQueue(priority).enqueueEvent(std::move(rawEvent));
}

void EventDispatcher::dispatchStateUpdate(
    StateUpdate &&stateUpdate,
    EventPriority priority) const {
  getEventQueue(priority).enqueueStateUpdate(std::move(stateUpdate));
}

void EventDispatcher::dispatchUniqueEvent(RawEvent &&rawEvent) const {
  if (unbatchedQueuesOnly_) {
    asynchronousUnbatchedQueue_->enqueueUniqueEvent(std::move(rawEvent));
  } else {
    asynchronousBatchedQueue_->enqueueUniqueEvent(std::move(rawEvent));
  }
}

const EventQueue &EventDispatcher::getEventQueue(EventPriority priority) const {
  if (unbatchedQueuesOnly_) {
    switch (priority) {
      case EventPriority::SynchronousUnbatched:
        return *synchronousUnbatchedQueue_;
      case EventPriority::SynchronousBatched:
        return *synchronousUnbatchedQueue_;
      case EventPriority::AsynchronousUnbatched:
        return *asynchronousUnbatchedQueue_;
      case EventPriority::AsynchronousBatched:
        return *asynchronousUnbatchedQueue_;
    }
  } else {
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
}

} // namespace react
} // namespace facebook
