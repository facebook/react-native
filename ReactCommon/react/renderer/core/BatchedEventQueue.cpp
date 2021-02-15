/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BatchedEventQueue.h"

namespace facebook {
namespace react {

BatchedEventQueue::BatchedEventQueue(
    EventPipe eventPipe,
    StatePipe statePipe,
    std::unique_ptr<EventBeat> eventBeat)
    : EventQueue(eventPipe, statePipe, std::move(eventBeat)) {}

void BatchedEventQueue::onEnqueue() const {
  eventBeat_->request();
}

void BatchedEventQueue::enqueueUniqueEvent(RawEvent const &rawEvent) const {
  {
    std::lock_guard<std::mutex> lock(queueMutex_);

    auto repeatedEvent = eventQueue_.rend();

    for (auto it = eventQueue_.rbegin(); it != eventQueue_.rend(); ++it) {
      if (it->type == rawEvent.type &&
          it->eventTarget == rawEvent.eventTarget) {
        repeatedEvent = it;
        break;
      } else if (it->eventTarget == rawEvent.eventTarget) {
        // It is necessary to maintain order of different event types
        // for the same target. If the same target has event types A1, B1
        // in the event queue and event A2 occurs. A1 has to stay in the
        // queue.
        break;
      }
    }

    if (repeatedEvent == eventQueue_.rend()) {
      eventQueue_.push_back(rawEvent);
    } else {
      *repeatedEvent = std::move(rawEvent);
    }
  }

  onEnqueue();
}

} // namespace react
} // namespace facebook
