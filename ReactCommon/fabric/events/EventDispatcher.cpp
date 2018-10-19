/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventDispatcher.h"

#include "BatchedEventQueue.h"
#include "UnbatchedEventQueue.h"

#define REACT_FABRIC_SYNC_EVENT_DISPATCHING_DISABLED

namespace facebook {
namespace react {

EventDispatcher::EventDispatcher(
    const EventPipe &eventPipe,
    const EventBeatFactory &synchonousEventBeatFactory,
    const EventBeatFactory &asynchonousEventBeatFactory) {
  // Synchronous/Unbatched
  eventQueues_[(int)EventPriority::SynchronousUnbatched] =
      std::make_unique<UnbatchedEventQueue>(
          eventPipe, synchonousEventBeatFactory());

  // Synchronous/Batched
  eventQueues_[(int)EventPriority::SynchronousBatched] =
      std::make_unique<BatchedEventQueue>(
          eventPipe, synchonousEventBeatFactory());

  // Asynchronous/Unbatched
  eventQueues_[(int)EventPriority::AsynchronousUnbatched] =
      std::make_unique<UnbatchedEventQueue>(
          eventPipe, asynchonousEventBeatFactory());

  // Asynchronous/Batched
  eventQueues_[(int)EventPriority::AsynchronousBatched] =
      std::make_unique<BatchedEventQueue>(
          eventPipe, asynchonousEventBeatFactory());
}

void EventDispatcher::dispatchEvent(
    const RawEvent &rawEvent,
    EventPriority priority) const {
#ifdef REACT_FABRIC_SYNC_EVENT_DISPATCHING_DISABLED
  // Synchronous dispatch works, but JavaScript interop layer does not have
  // proper synchonization yet and it crashes.
  if (priority == EventPriority::SynchronousUnbatched) {
    priority = EventPriority::AsynchronousUnbatched;
  }

  if (priority == EventPriority::SynchronousBatched) {
    priority = EventPriority::AsynchronousBatched;
  }
#endif

  eventQueues_[(int)priority]->enqueueEvent(rawEvent);
}

} // namespace react
} // namespace facebook
