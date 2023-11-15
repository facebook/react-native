/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryReporter.h"
#include <cxxreact/JSExecutor.h>
#include <react/renderer/core/EventLogger.h>
#include <react/utils/CoreFeatures.h>
#include "NativePerformanceObserver.h"

#include <functional>
#include <unordered_map>

#include <glog/logging.h>

namespace facebook::react {
EventTag PerformanceEntryReporter::sCurrentEventTag_{0};

PerformanceEntryReporter& PerformanceEntryReporter::getInstance() {
  static PerformanceEntryReporter instance;
  return instance;
}

PerformanceEntryReporter::PerformanceEntryReporter() {
  // For mark entry types we also want to keep the lookup by name, to make
  // sure that marks can be referenced by measures
  getBuffer(PerformanceEntryType::MARK).hasNameLookup = true;
}

void PerformanceEntryReporter::setReportingCallback(
    std::optional<AsyncCallback<>> callback) {
  callback_ = callback;
}

double PerformanceEntryReporter::getCurrentTimeStamp() const {
  return timeStampProvider_ != nullptr ? timeStampProvider_()
                                       : JSExecutor::performanceNow();
}

void PerformanceEntryReporter::startReporting(PerformanceEntryType entryType) {
  auto& buffer = getBuffer(entryType);
  buffer.isReporting = true;
  buffer.durationThreshold = DEFAULT_DURATION_THRESHOLD;
}

void PerformanceEntryReporter::setAlwaysLogged(
    PerformanceEntryType entryType,
    bool isAlwaysLogged) {
  auto& buffer = getBuffer(entryType);
  buffer.isAlwaysLogged = isAlwaysLogged;
}

void PerformanceEntryReporter::setDurationThreshold(
    PerformanceEntryType entryType,
    double durationThreshold) {
  getBuffer(entryType).durationThreshold = durationThreshold;
}

void PerformanceEntryReporter::stopReporting(PerformanceEntryType entryType) {
  getBuffer(entryType).isReporting = false;
}

void PerformanceEntryReporter::stopReporting() {
  for (auto& buffer : buffers_) {
    buffer.isReporting = false;
  }
}

GetPendingEntriesResult PerformanceEntryReporter::popPendingEntries() {
  std::lock_guard lock(entriesMutex_);
  GetPendingEntriesResult res = {
      std::vector<RawPerformanceEntry>(), droppedEntryCount_};
  for (auto& buffer : buffers_) {
    buffer.entries.consume(res.entries);
  }

  // Sort by starting time (or ending time, if starting times are equal)
  std::stable_sort(
      res.entries.begin(),
      res.entries.end(),
      [](const RawPerformanceEntry& lhs, const RawPerformanceEntry& rhs) {
        if (lhs.startTime != rhs.startTime) {
          return lhs.startTime < rhs.startTime;
        } else {
          return lhs.duration < rhs.duration;
        }
      });

  droppedEntryCount_ = 0;
  return res;
}

void PerformanceEntryReporter::logEntry(const RawPerformanceEntry& entry) {
  const auto entryType = static_cast<PerformanceEntryType>(entry.entryType);
  if (entryType == PerformanceEntryType::EVENT) {
    eventCounts_[entry.name]++;
  }

  if (!isReporting(entryType) && !isAlwaysLogged(entryType)) {
    return;
  }

  std::lock_guard lock(entriesMutex_);

  auto& buffer = buffers_[entry.entryType];

  if (entry.duration < buffer.durationThreshold) {
    // The entries duration is lower than the desired reporting threshold, skip
    return;
  }

  if (buffer.hasNameLookup) {
    auto overwriteCandidate = buffer.entries.getNextOverwriteCandidate();
    if (overwriteCandidate != nullptr) {
      std::lock_guard lock2(nameLookupMutex_);
      auto it = buffer.nameLookup.find(overwriteCandidate);
      if (it != buffer.nameLookup.end() && *it == overwriteCandidate) {
        buffer.nameLookup.erase(it);
      }
    }
  }

  auto pushResult = buffer.entries.add(std::move(entry));
  if (pushResult ==
      BoundedConsumableBuffer<RawPerformanceEntry>::PushStatus::DROP) {
    // Start dropping entries once reached maximum buffer size.
    // The number of dropped entries will be reported back to the corresponding
    // PerformanceObserver callback.
    droppedEntryCount_ += 1;
  }

  if (buffer.hasNameLookup) {
    std::lock_guard lock2(nameLookupMutex_);
    buffer.nameLookup.insert(&buffer.entries.back());
  }

  if (buffer.entries.getNumToConsume() == 1) {
    // If the buffer was empty, it signals that JS side just has possibly
    // consumed it and is ready to get more
    scheduleFlushBuffer();
  }
}

void PerformanceEntryReporter::mark(
    const std::string& name,
    const std::optional<double>& startTime) {
  logEntry(RawPerformanceEntry{
      name,
      static_cast<int>(PerformanceEntryType::MARK),
      startTime ? *startTime : getCurrentTimeStamp(),
      0.0,
      std::nullopt,
      std::nullopt,
      std::nullopt});
}

void PerformanceEntryReporter::clearEntries(
    PerformanceEntryType entryType,
    std::string_view entryName) {
  if (entryType == PerformanceEntryType::UNDEFINED) {
    // Clear all entry types
    for (int i = 1; i < NUM_PERFORMANCE_ENTRY_TYPES; i++) {
      clearEntries(static_cast<PerformanceEntryType>(i), entryName);
    }
  } else {
    auto& buffer = getBuffer(entryType);
    if (!entryName.empty()) {
      if (buffer.hasNameLookup) {
        std::lock_guard lock2(nameLookupMutex_);
        RawPerformanceEntry entry{
            std::string(entryName),
            static_cast<int>(entryType),
            0.0,
            0.0,
            std::nullopt,
            std::nullopt,
            std::nullopt};
        buffer.nameLookup.erase(&entry);
      }

      std::lock_guard lock(entriesMutex_);
      buffer.entries.clear([entryName](const RawPerformanceEntry& entry) {
        return entry.name == entryName;
      });
    } else {
      {
        std::lock_guard lock(entriesMutex_);
        buffer.entries.clear();
      }
      {
        std::lock_guard lock2(nameLookupMutex_);
        buffer.nameLookup.clear();
      }
    }
  }
}

void PerformanceEntryReporter::getEntries(
    PerformanceEntryType entryType,
    std::string_view entryName,
    std::vector<RawPerformanceEntry>& res) const {
  if (entryType == PerformanceEntryType::UNDEFINED) {
    // Collect all entry types
    for (int i = 1; i < NUM_PERFORMANCE_ENTRY_TYPES; i++) {
      getEntries(static_cast<PerformanceEntryType>(i), entryName, res);
    }
  } else {
    std::lock_guard lock(entriesMutex_);
    const auto& entries = getBuffer(entryType).entries;
    if (entryName.empty()) {
      entries.getEntries(res);
    } else {
      entries.getEntries(res, [entryName](const RawPerformanceEntry& entry) {
        return entry.name == entryName;
      });
    }
  }
}

std::vector<RawPerformanceEntry> PerformanceEntryReporter::getEntries(
    PerformanceEntryType entryType,
    std::string_view entryName) const {
  std::vector<RawPerformanceEntry> res;
  getEntries(entryType, entryName, res);
  return res;
}

void PerformanceEntryReporter::measure(
    const std::string& name,
    double startTime,
    double endTime,
    const std::optional<double>& duration,
    const std::optional<std::string>& startMark,
    const std::optional<std::string>& endMark) {
  double startTimeVal = startMark ? getMarkTime(*startMark) : startTime;
  double endTimeVal = endMark ? getMarkTime(*endMark) : endTime;

  if (!endMark && endTime < startTimeVal) {
    // The end time is not specified, take the current time, according to the
    // standard
    endTimeVal = getCurrentTimeStamp();
  }

  double durationVal = duration ? *duration : endTimeVal - startTimeVal;

  logEntry(
      {name,
       static_cast<int>(PerformanceEntryType::MEASURE),
       startTimeVal,
       durationVal,
       std::nullopt,
       std::nullopt,
       std::nullopt});
}

double PerformanceEntryReporter::getMarkTime(
    const std::string& markName) const {
  RawPerformanceEntry mark{
      markName,
      static_cast<int>(PerformanceEntryType::MARK),
      0.0,
      0.0,
      std::nullopt,
      std::nullopt,
      std::nullopt};

  std::lock_guard lock(nameLookupMutex_);
  const auto& marksBuffer = getBuffer(PerformanceEntryType::MARK);
  auto it = marksBuffer.nameLookup.find(&mark);
  if (it != marksBuffer.nameLookup.end()) {
    return (*it)->startTime;
  } else {
    return 0.0;
  }
}

void PerformanceEntryReporter::logEventEntry(
    std::string name,
    double startTime,
    double duration,
    double processingStart,
    double processingEnd,
    uint32_t interactionId) {
  logEntry(
      {std::move(name),
       static_cast<int>(PerformanceEntryType::EVENT),
       startTime,
       duration,
       processingStart,
       processingEnd,
       interactionId});
}

void PerformanceEntryReporter::scheduleFlushBuffer() {
  if (callback_) {
    callback_->callWithPriority(SchedulerPriority::IdlePriority);
  }
}

struct StrKey {
  uint32_t key;
  StrKey(std::string_view s) : key(std::hash<std::string_view>{}(s)) {}

  bool operator==(const StrKey& rhs) const {
    return key == rhs.key;
  }
};

struct StrKeyHash {
  constexpr size_t operator()(const StrKey& strKey) const {
    return static_cast<size_t>(strKey.key);
  }
};

// Supported events for reporting, see
// https://www.w3.org/TR/event-timing/#sec-events-exposed
// Not all of these are currently supported by RN, but we map them anyway for
// future-proofing.
using SupportedEventTypeRegistry =
    std::unordered_map<StrKey, std::string_view, StrKeyHash>;

static const SupportedEventTypeRegistry& getSupportedEvents() {
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

EventTag PerformanceEntryReporter::onEventStart(std::string_view name) {
  if (!isReporting(PerformanceEntryType::EVENT)) {
    return 0;
  }
  const auto& supportedEvents = getSupportedEvents();
  auto it = supportedEvents.find(name);
  if (it == supportedEvents.end()) {
    return 0;
  }

  auto reportedName = it->second;

  sCurrentEventTag_++;
  if (sCurrentEventTag_ == 0) {
    // The tag wrapped around (which is highly unlikely, but still)
    sCurrentEventTag_ = 1;
  }

  auto timeStamp = getCurrentTimeStamp();
  {
    std::lock_guard lock(eventsInFlightMutex_);
    eventsInFlight_.emplace(std::make_pair(
        sCurrentEventTag_, EventEntry{reportedName, timeStamp, 0.0}));
  }
  return sCurrentEventTag_;
}

void PerformanceEntryReporter::onEventProcessingStart(EventTag tag) {
  if (!isReporting(PerformanceEntryType::EVENT) || tag == 0) {
    return;
  }
  auto timeStamp = getCurrentTimeStamp();
  {
    std::lock_guard lock(eventsInFlightMutex_);
    auto it = eventsInFlight_.find(tag);
    if (it != eventsInFlight_.end()) {
      it->second.processingStartTime = timeStamp;
    }
  }
}

void PerformanceEntryReporter::onEventProcessingEnd(EventTag tag) {
  if (!isReporting(PerformanceEntryType::EVENT) || tag == 0) {
    return;
  }
  auto timeStamp = getCurrentTimeStamp();
  {
    std::lock_guard lock(eventsInFlightMutex_);
    auto it = eventsInFlight_.find(tag);
    if (it == eventsInFlight_.end()) {
      return;
    }
    auto& entry = it->second;
    entry.processingEndTime = timeStamp;

    if (CoreFeatures::enableReportEventPaintTime) {
      // If reporting paint time, don't send the entry just yet and wait for the
      // mount hook callback to be called
      return;
    }

    const auto& name = entry.name;

    logEventEntry(
        std::string(name),
        entry.startTime,
        timeStamp - entry.startTime,
        entry.processingStartTime,
        entry.processingEndTime,
        entry.interactionId);
    eventsInFlight_.erase(it);
  }
}

void PerformanceEntryReporter::shadowTreeDidMount(
    const RootShadowNode::Shared& /*rootShadowNode*/,
    double mountTime) noexcept {
  if (!isReporting(PerformanceEntryType::EVENT) ||
      !CoreFeatures::enableReportEventPaintTime) {
    return;
  }

  std::lock_guard lock(eventsInFlightMutex_);
  auto it = eventsInFlight_.begin();
  while (it != eventsInFlight_.end()) {
    const auto& entry = it->second;
    if (entry.processingEndTime == 0.0 || entry.processingEndTime > mountTime) {
      // This mount doesn't correspond to the event
      ++it;
      continue;
    }

    logEventEntry(
        std::string(entry.name),
        entry.startTime,
        mountTime - entry.startTime,
        entry.processingStartTime,
        entry.processingEndTime,
        entry.interactionId);
    it = eventsInFlight_.erase(it);
  }
}

} // namespace facebook::react
