/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BatchedEventQueue.h"
#include <algorithm>

namespace facebook {
namespace react {

void BatchedEventQueue::onEnqueue() const {
  EventQueue::onEnqueue();

  eventBeat_->request();
}

void BatchedEventQueue::enqueueUniqueEvent(const RawEvent &rawEvent) const {
  {
    std::lock_guard<std::mutex> lock(queueMutex_);
    auto const position = std::find_if(
        eventQueue_.begin(), eventQueue_.end(), [&rawEvent](auto const &event) {
          return event.type == rawEvent.type &&
              event.eventTarget == rawEvent.eventTarget;
        });
    if (position != eventQueue_.end()) {
      eventQueue_.erase(position);
    }

    eventQueue_.push_back(rawEvent);
  }

  onEnqueue();
}

} // namespace react
} // namespace facebook
