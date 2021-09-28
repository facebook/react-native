/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventQueue.h"

#include "EventEmitter.h"
#include "ShadowNodeFamily.h"

namespace facebook {
namespace react {

EventQueue::EventQueue(
    EventPipe eventPipe,
    StatePipe statePipe,
    std::unique_ptr<EventBeat> eventBeat)
    : eventPipe_(std::move(eventPipe)),
      statePipe_(std::move(statePipe)),
      eventBeat_(std::move(eventBeat)) {
  eventBeat_->setBeatCallback(
      std::bind(&EventQueue::onBeat, this, std::placeholders::_1));
}

void EventQueue::enqueueEvent(const RawEvent &rawEvent) const {
  {
    std::lock_guard<std::mutex> lock(queueMutex_);
    eventQueue_.push_back(rawEvent);
  }

  onEnqueue();
}

void EventQueue::enqueueStateUpdate(const StateUpdate &stateUpdate) const {
  {
    std::lock_guard<std::mutex> lock(queueMutex_);
    if (!stateUpdateQueue_.empty()) {
      auto const position = stateUpdateQueue_.back();
      if (stateUpdate.family == position.family) {
        stateUpdateQueue_.pop_back();
      }
    }
    stateUpdateQueue_.push_back(stateUpdate);
  }

  onEnqueue();
}

void EventQueue::onEnqueue() const {
  // Default implementation does nothing.
}

void EventQueue::onBeat(jsi::Runtime &runtime) const {
  flushEvents(runtime);
  flushStateUpdates();
}

void EventQueue::flushEvents(jsi::Runtime &runtime) const {
  std::vector<RawEvent> queue;

  {
    std::lock_guard<std::mutex> lock(queueMutex_);

    if (eventQueue_.size() == 0) {
      return;
    }

    queue = std::move(eventQueue_);
    eventQueue_.clear();
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

void EventQueue::flushStateUpdates() const {
  std::vector<StateUpdate> stateUpdateQueue;

  {
    std::lock_guard<std::mutex> lock(queueMutex_);

    if (stateUpdateQueue_.empty()) {
      return;
    }

    stateUpdateQueue = std::move(stateUpdateQueue_);
    stateUpdateQueue_.clear();
  }

  for (const auto &stateUpdate : stateUpdateQueue) {
    statePipe_(stateUpdate);
  }
}

} // namespace react
} // namespace facebook
