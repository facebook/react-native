/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cxxreact/JSExecutor.h>
#include <logger/react_native_log.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include "EventEmitter.h"
#include "EventLogger.h"
#include "EventQueue.h"
#include "ShadowNodeFamily.h"

namespace facebook::react {

EventQueueProcessor::EventQueueProcessor(
    EventPipe eventPipe,
    EventPipeConclusion eventPipeConclusion,
    StatePipe statePipe,
    std::weak_ptr<EventLogger> eventLogger)
    : eventPipe_(std::move(eventPipe)),
      eventPipeConclusion_(std::move(eventPipeConclusion)),
      statePipe_(std::move(statePipe)),
      eventLogger_(std::move(eventLogger)) {}

void EventQueueProcessor::flushEvents(
    jsi::Runtime& runtime,
    std::vector<RawEvent>&& events) const {
  {
    std::scoped_lock lock(EventEmitter::DispatchMutex());

    for (const auto& event : events) {
      if (event.eventTarget) {
        event.eventTarget->retain(runtime);
      }
    }
  }

  for (const auto& event : events) {
    auto reactPriority = ReactEventPriority::Default;

    if (ReactNativeFeatureFlags::
            fixMappingOfEventPrioritiesBetweenFabricAndReact()) {
      reactPriority = [&]() {
        switch (event.category) {
          case RawEvent::Category::Discrete:
            return ReactEventPriority::Discrete;
          case RawEvent::Category::ContinuousStart:
            hasContinuousEventStarted_ = true;
            return ReactEventPriority::Discrete;
          case RawEvent::Category::ContinuousEnd:
            hasContinuousEventStarted_ = false;
            return ReactEventPriority::Discrete;
          case RawEvent::Category::Continuous:
            return ReactEventPriority::Continuous;
          case RawEvent::Category::Unspecified:
            return hasContinuousEventStarted_ ? ReactEventPriority::Continuous
                                              : ReactEventPriority::Default;
        }
        return ReactEventPriority::Default;
      }();
    } else {
      if (event.category == RawEvent::Category::ContinuousEnd) {
        hasContinuousEventStarted_ = false;
      }

      reactPriority = hasContinuousEventStarted_ ? ReactEventPriority::Default
                                                 : ReactEventPriority::Discrete;

      if (event.category == RawEvent::Category::Continuous) {
        reactPriority = ReactEventPriority::Default;
      }

      if (event.category == RawEvent::Category::Discrete) {
        reactPriority = ReactEventPriority::Discrete;
      }
    }

    auto eventLogger = eventLogger_.lock();
    if (eventLogger != nullptr) {
      eventLogger->onEventProcessingStart(event.loggingTag);
    }

    if (event.eventPayload == nullptr) {
      react_native_log_error(
          "EventQueueProcessor: Unexpected null event payload");
      continue;
    }

    eventPipe_(
        runtime,
        event.eventTarget.get(),
        event.type,
        reactPriority,
        *event.eventPayload);

    if (eventLogger != nullptr) {
      eventLogger->onEventProcessingEnd(event.loggingTag);
    }

    if (event.category == RawEvent::Category::ContinuousStart) {
      hasContinuousEventStarted_ = true;
    }
  }

  // We only run the "Conclusion" once per event group when batched.
  eventPipeConclusion_(runtime);

  // No need to lock `EventEmitter::DispatchMutex()` here.
  // The mutex protects from a situation when the `instanceHandle` can be
  // deallocated during accessing, but that's impossible at this point because
  // we have a strong pointer to it.
  for (const auto& event : events) {
    if (event.eventTarget) {
      event.eventTarget->release(runtime);
    }
  }
}

void EventQueueProcessor::flushStateUpdates(
    std::vector<StateUpdate>&& states) const {
  for (const auto& stateUpdate : states) {
    statePipe_(stateUpdate);
  }
}

} // namespace facebook::react
