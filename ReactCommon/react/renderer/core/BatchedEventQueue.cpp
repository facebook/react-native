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
    if (!eventQueue_.empty()) {
      auto const position = eventQueue_.back();
      if (position.type == rawEvent.type &&
          position.eventTarget == rawEvent.eventTarget) {
        eventQueue_.pop_back();
      }
    }

    eventQueue_.push_back(rawEvent);
  }

  onEnqueue();
}

} // namespace react
} // namespace facebook
