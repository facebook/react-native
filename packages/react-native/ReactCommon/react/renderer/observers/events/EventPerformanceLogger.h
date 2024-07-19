/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <react/renderer/core/EventLogger.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>
#include <memory>
#include <mutex>
#include <string_view>
#include <unordered_map>

namespace facebook::react {

class EventPerformanceLogger : public EventLogger, public UIManagerMountHook {
 public:
  explicit EventPerformanceLogger(
      std::weak_ptr<PerformanceEntryReporter> performanceEntryReporter);

#pragma mark - EventLogger

  EventTag onEventStart(std::string_view name) override;
  void onEventProcessingStart(EventTag tag) override;
  void onEventProcessingEnd(EventTag tag) override;

#pragma mark - UIManagerMountHook

  void shadowTreeDidMount(
      const RootShadowNode::Shared& rootShadowNode,
      double mountTime) noexcept override;

 private:
  struct EventEntry {
    std::string_view name;
    DOMHighResTimeStamp startTime{0.0};
    DOMHighResTimeStamp processingStartTime{0.0};
    DOMHighResTimeStamp processingEndTime{0.0};

    // TODO: Define the way to assign interaction IDs to the event chains
    // (T141358175)
    PerformanceEntryInteractionId interactionId{0};
  };

  // Registry to store the events that are currently ongoing.
  // Note that we could probably use a more efficient container for that,
  // but since we only report discrete events, the volume is normally low,
  // so a hash map should be just fine.
  std::unordered_map<EventTag, EventEntry> eventsInFlight_;
  std::mutex eventsInFlightMutex_;

  std::weak_ptr<PerformanceEntryReporter> performanceEntryReporter_;

  EventTag sCurrentEventTag_{EMPTY_EVENT_TAG};

  EventTag createEventTag();
};

} // namespace facebook::react
