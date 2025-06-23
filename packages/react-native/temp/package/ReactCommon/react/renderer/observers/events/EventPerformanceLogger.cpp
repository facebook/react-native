/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventPerformanceLogger.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/timing/primitives.h>
#include <react/utils/CoreFeatures.h>
#include <unordered_map>

namespace facebook::react {

namespace {

bool isTargetInRootShadowNode(
    const SharedEventTarget& target,
    const RootShadowNode::Shared& rootShadowNode) {
  return target && rootShadowNode &&
      target->getSurfaceId() == rootShadowNode->getSurfaceId();
}

bool hasPendingRenderingUpdates(
    const SharedEventTarget& target,
    const std::unordered_set<SurfaceId>&
        surfaceIdsWithPendingRenderingUpdates) {
  return target != nullptr &&
      surfaceIdsWithPendingRenderingUpdates.contains(target->getSurfaceId());
}

struct StrKey {
  size_t key;
  StrKey(std::string_view s) : key(std::hash<std::string_view>{}(s)) {}

  bool operator==(const StrKey& rhs) const {
    return key == rhs.key;
  }
};

struct StrKeyHash {
  constexpr size_t operator()(const StrKey& strKey) const {
    return strKey.key;
  }
};

// Supported events for reporting, see
// https://www.w3.org/TR/event-timing/#sec-events-exposed
// Not all of these are currently supported by RN, but we map them anyway for
// future-proofing.
using SupportedEventTypeRegistry =
    std::unordered_map<StrKey, std::string_view, StrKeyHash>;

const SupportedEventTypeRegistry& getSupportedEvents() {
  static SupportedEventTypeRegistry SUPPORTED_EVENTS = {
      {StrKey("topAuxClick"), "auxclick"},
      {StrKey("topClick"), "click"},
      {StrKey("topContextMenu"), "contextmenu"},
      {StrKey("topDblClick"), "dblclick"},
      {StrKey("topMouseDown"), "mousedown"},
      {StrKey("topMouseEnter"), "mouseenter"},
      {StrKey("topMouseLeave"), "mouseleave"},
      {StrKey("topMouseOut"), "mouseout"},
      {StrKey("topMouseOver"), "mouseover"},
      {StrKey("topMouseUp"), "mouseup"},
      {StrKey("topPointerOver"), "pointerover"},
      {StrKey("topPointerEnter"), "pointerenter"},
      {StrKey("topPointerDown"), "pointerdown"},
      {StrKey("topPointerUp"), "pointerup"},
      {StrKey("topPointerCancel"), "pointercancel"},
      {StrKey("topPointerOut"), "pointerout"},
      {StrKey("topPointerLeave"), "pointerleave"},
      {StrKey("topGotPointerCapture"), "gotpointercapture"},
      {StrKey("topLostPointerCapture"), "lostpointercapture"},
      {StrKey("topTouchStart"), "touchstart"},
      {StrKey("topTouchEnd"), "touchend"},
      {StrKey("topTouchCancel"), "touchcancel"},
      {StrKey("topKeyDown"), "keydown"},
      {StrKey("topKeyPress"), "keypress"},
      {StrKey("topKeyUp"), "keyup"},
      {StrKey("topBeforeInput"), "beforeinput"},
      {StrKey("topInput"), "input"},
      {StrKey("topCompositionStart"), "compositionstart"},
      {StrKey("topCompositionUpdate"), "compositionupdate"},
      {StrKey("topCompositionEnd"), "compositionend"},
      {StrKey("topDragStart"), "dragstart"},
      {StrKey("topDragEnd"), "dragend"},
      {StrKey("topDragEnter"), "dragenter"},
      {StrKey("topDragLeave"), "dragleave"},
      {StrKey("topDragOver"), "dragover"},
      {StrKey("topDrop"), "drop"},
  };
  return SUPPORTED_EVENTS;
}

} // namespace

EventPerformanceLogger::EventPerformanceLogger(
    std::weak_ptr<PerformanceEntryReporter> performanceEntryReporter)
    : performanceEntryReporter_(std::move(performanceEntryReporter)) {}

EventTag EventPerformanceLogger::onEventStart(
    std::string_view name,
    SharedEventTarget target) {
  auto performanceEntryReporter = performanceEntryReporter_.lock();
  if (performanceEntryReporter == nullptr) {
    return EMPTY_EVENT_TAG;
  }

  const auto& supportedEvents = getSupportedEvents();
  auto it = supportedEvents.find(name);
  if (it == supportedEvents.end()) {
    return 0;
  }

  auto reportedName = it->second;

  auto eventTag = createEventTag();

  auto timeStamp = performanceEntryReporter->getCurrentTimeStamp();
  {
    std::lock_guard lock(eventsInFlightMutex_);
    eventsInFlight_.emplace(
        eventTag, EventEntry{reportedName, target, timeStamp, 0.0});
  }
  return eventTag;
}

void EventPerformanceLogger::onEventProcessingStart(EventTag tag) {
  auto performanceEntryReporter = performanceEntryReporter_.lock();
  if (performanceEntryReporter == nullptr) {
    return;
  }

  auto timeStamp = performanceEntryReporter->getCurrentTimeStamp();
  {
    std::lock_guard lock(eventsInFlightMutex_);
    auto it = eventsInFlight_.find(tag);
    if (it != eventsInFlight_.end()) {
      it->second.processingStartTime = timeStamp;
    }
  }
}

void EventPerformanceLogger::onEventProcessingEnd(EventTag tag) {
  auto performanceEntryReporter = performanceEntryReporter_.lock();
  if (performanceEntryReporter == nullptr) {
    return;
  }

  auto timeStamp = performanceEntryReporter->getCurrentTimeStamp();
  {
    std::lock_guard lock(eventsInFlightMutex_);
    auto it = eventsInFlight_.find(tag);
    if (it == eventsInFlight_.end()) {
      return;
    }

    auto& entry = it->second;
    entry.processingEndTime = timeStamp;

    if (ReactNativeFeatureFlags::enableReportEventPaintTime()) {
      // If reporting paint time, don't send the entry just yet and wait for the
      // task to finish.
      return;
    }

    const auto& name = entry.name;

    performanceEntryReporter->logEventEntry(
        std::string(name),
        entry.startTime,
        timeStamp - entry.startTime,
        entry.processingStartTime,
        entry.processingEndTime,
        entry.interactionId);
    eventsInFlight_.erase(it);
  }
}

void EventPerformanceLogger::dispatchPendingEventTimingEntries(
    const std::unordered_set<SurfaceId>&
        surfaceIdsWithPendingRenderingUpdates) {
  if (!ReactNativeFeatureFlags::enableReportEventPaintTime()) {
    return;
  }

  auto performanceEntryReporter = performanceEntryReporter_.lock();
  if (performanceEntryReporter == nullptr) {
    return;
  }

  std::lock_guard lock(eventsInFlightMutex_);
  auto it = eventsInFlight_.begin();
  while (it != eventsInFlight_.end()) {
    auto& entry = it->second;

    if (entry.isWaitingForDispatch() || entry.isWaitingForMount) {
      ++it;
    } else if (hasPendingRenderingUpdates(
                   entry.target, surfaceIdsWithPendingRenderingUpdates)) {
      // We'll wait for mount to report the event
      entry.isWaitingForMount = true;
      ++it;
    } else {
      performanceEntryReporter->logEventEntry(
          std::string(entry.name),
          entry.startTime,
          performanceEntryReporter->getCurrentTimeStamp() - entry.startTime,
          entry.processingStartTime,
          entry.processingEndTime,
          entry.interactionId);
      it = eventsInFlight_.erase(it);
    }
  }
}

void EventPerformanceLogger::shadowTreeDidMount(
    const RootShadowNode::Shared& rootShadowNode,
    double mountTime) noexcept {
  if (!ReactNativeFeatureFlags::enableReportEventPaintTime()) {
    return;
  }

  auto performanceEntryReporter = performanceEntryReporter_.lock();
  if (performanceEntryReporter == nullptr) {
    return;
  }

  std::lock_guard lock(eventsInFlightMutex_);
  auto it = eventsInFlight_.begin();
  while (it != eventsInFlight_.end()) {
    const auto& entry = it->second;
    if (entry.isWaitingForMount &&
        isTargetInRootShadowNode(entry.target, rootShadowNode)) {
      performanceEntryReporter->logEventEntry(
          std::string(entry.name),
          entry.startTime,
          mountTime - entry.startTime,
          entry.processingStartTime,
          entry.processingEndTime,
          entry.interactionId);
      it = eventsInFlight_.erase(it);
    } else {
      ++it;
    }
  }
}

EventTag EventPerformanceLogger::createEventTag() {
  sCurrentEventTag_++;
  return sCurrentEventTag_;
}

} // namespace facebook::react
