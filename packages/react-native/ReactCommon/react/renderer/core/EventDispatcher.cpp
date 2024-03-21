/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventDispatcher.h"
#include <cxxreact/JSExecutor.h>
#include <react/renderer/core/StateUpdate.h>
#include "EventLogger.h"

#include "EventQueue.h"
#include "RawEvent.h"

namespace facebook::react {

EventDispatcher::EventDispatcher(
    const EventQueueProcessor& eventProcessor,
    const EventBeat::Factory& asynchronousEventBeatFactory,
    const EventBeat::SharedOwnerBox& ownerBox)
    : eventQueue_(
          EventQueue(eventProcessor, asynchronousEventBeatFactory(ownerBox))) {}

void EventDispatcher::dispatchEvent(RawEvent&& rawEvent) const {
  // Allows the event listener to interrupt default event dispatch
  if (eventListeners_.willDispatchEvent(rawEvent)) {
    return;
  }

  auto eventLogger = getEventLogger();
  if (eventLogger != nullptr) {
    rawEvent.loggingTag = eventLogger->onEventStart(rawEvent.type);
  }
  eventQueue_.enqueueEvent(std::move(rawEvent));
}

void EventDispatcher::dispatchStateUpdate(StateUpdate&& stateUpdate) const {
  eventQueue_.enqueueStateUpdate(std::move(stateUpdate));
}

void EventDispatcher::dispatchUniqueEvent(RawEvent&& rawEvent) const {
  // Allows the event listener to interrupt default event dispatch
  if (eventListeners_.willDispatchEvent(rawEvent)) {
    return;
  }
  eventQueue_.enqueueUniqueEvent(std::move(rawEvent));
}

void EventDispatcher::addListener(
    const std::shared_ptr<const EventListener>& listener) const {
  eventListeners_.addListener(listener);
}

/*
 * Removes provided event listener to the event dispatcher.
 */
void EventDispatcher::removeListener(
    const std::shared_ptr<const EventListener>& listener) const {
  eventListeners_.removeListener(listener);
}

} // namespace facebook::react
