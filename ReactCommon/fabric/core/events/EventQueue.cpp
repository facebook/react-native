/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventQueue.h"

#include "EventEmitter.h"

namespace facebook {
namespace react {

EventQueue::EventQueue(
    EventPipe eventPipe,
    std::unique_ptr<EventBeat> eventBeat)
    : eventPipe_(std::move(eventPipe)), eventBeat_(std::move(eventBeat)) {
  eventBeat_->setBeatCallback(
      std::bind(&EventQueue::onBeat, this, std::placeholders::_1));
}

void EventQueue::enqueueEvent(const RawEvent &rawEvent) const {
  std::lock_guard<std::mutex> lock(queueMutex_);
  queue_.push_back(rawEvent);
}

void EventQueue::onBeat(jsi::Runtime &runtime) const {
  std::vector<RawEvent> queue;

  {
    std::lock_guard<std::mutex> lock(queueMutex_);

    if (queue_.size() == 0) {
      return;
    }

    queue = std::move(queue_);
    queue_.clear();
  }

  {
    std::lock_guard<std::mutex> lock(EventEmitter::DispatchMutex());

    for (const auto &event : queue) {
      if (event.eventTarget) {
        event.eventTarget->retain(runtime);
      }
    }
  }

  for (const auto &event : queue) {
    eventPipe_(
        runtime, event.eventTarget.get(), event.type, event.payloadFactory);
  }

  // No need to lock `EventEmitter::DispatchMutex()` here.
  // The mutex protects from a situation when the `instanceHandle` can be
  // deallocated during accessing, but that's impossible at this point because
  // we have a strong pointer to it.
  for (const auto &event : queue) {
    if (event.eventTarget) {
      event.eventTarget->release(runtime);
    }
  }
}

} // namespace react
} // namespace facebook
