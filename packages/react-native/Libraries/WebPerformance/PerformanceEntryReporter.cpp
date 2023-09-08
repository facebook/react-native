/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryReporter.h"
#include <cxxreact/JSExecutor.h>
#include <react/renderer/core/EventLogger.h>
#include "NativePerformanceObserver.h"

#include <unordered_map>

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
  std::scoped_lock lock(entriesMutex_);
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

  std::scoped_lock lock(entriesMutex_);

  auto& buffer = buffers_[entry.entryType];

  if (entry.duration < buffer.durationThreshold) {
    // The entries duration is lower than the desired reporting threshold, skip
    return;
  }

  if (buffer.hasNameLookup) {
    auto overwriteCandidate = buffer.entries.getNextOverwriteCandidate();
    if (overwriteCandidate != nullptr) {
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
    const char* entryName) {
  if (entryType == PerformanceEntryType::UNDEFINED) {
    // Clear all entry types
    for (int i = 1; i < NUM_PERFORMANCE_ENTRY_TYPES; i++) {
      clearEntries(static_cast<PerformanceEntryType>(i), entryName);
    }
  } else {
    auto& buffer = getBuffer(entryType);
    if (entryName != nullptr) {
      if (buffer.hasNameLookup) {
        RawPerformanceEntry entry{
            entryName,
            static_cast<int>(entryType),
            0.0,
            0.0,
            std::nullopt,
            std::nullopt,
            std::nullopt};
        buffer.nameLookup.erase(&entry);
      }
      buffer.entries.clear([entryName](const RawPerformanceEntry& entry) {
        return std::strcmp(entry.name.c_str(), entryName) == 0;
      });
    } else {
      buffer.entries.clear();
      buffer.nameLookup.clear();
    }
  }
}

void PerformanceEntryReporter::getEntries(
    PerformanceEntryType entryType,
    const char* entryName,
    std::vector<RawPerformanceEntry>& res) const {
  if (entryType == PerformanceEntryType::UNDEFINED) {
    // Collect all entry types
    for (int i = 1; i < NUM_PERFORMANCE_ENTRY_TYPES; i++) {
      getEntries(static_cast<PerformanceEntryType>(i), entryName, res);
    }
  } else {
    const auto& entries = getBuffer(entryType).entries;
    if (entryName == nullptr) {
      entries.getEntries(res);
    } else {
      entries.getEntries(res, [entryName](const RawPerformanceEntry& entry) {
        return std::strcmp(entry.name.c_str(), entryName) == 0;
      });
    }
  }
}

std::vector<RawPerformanceEntry> PerformanceEntryReporter::getEntries(
    PerformanceEntryType entryType,
    const char* entryName) const {
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

  const auto& marksBuffer = getBuffer(PerformanceEntryType::MARK);
  auto it = marksBuffer.nameLookup.find(&mark);
  if (it != marksBuffer.nameLookup.end()) {
    return (*it)->startTime;
  } else {
    return 0.0;
  }
}

void PerformanceEntryReporter::event(
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
  StrKey(const char* s) : key(folly::hash::fnv32_buf(s, std::strlen(s))) {}

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
    std::unordered_map<StrKey, const char*, StrKeyHash>;

static const SupportedEventTypeRegistry& getSupportedEvents() {
  static SupportedEventTypeRegistry SUPPORTED_EVENTS = {
      {"topAuxClick", "auxclick"},
      {"topClick", "click"},
      {"topContextMenu", "contextmenu"},
      {"topDblClick", "dblclick"},
      {"topMouseDown", "mousedown"},
      {"topMouseEnter", "mouseenter"},
      {"topMouseLeave", "mouseleave"},
      {"topMouseOut", "mouseout"},
      {"topMouseOver", "mouseover"},
      {"topMouseUp", "mouseup"},
      {"topPointerOver", "pointerover"},
      {"topPointerEnter", "pointerenter"},
      {"topPointerDown", "pointerdown"},
      {"topPointerUp", "pointerup"},
      {"topPointerCancel", "pointercancel"},
      {"topPointerOut", "pointerout"},
      {"topPointerLeave", "pointerleave"},
      {"topGotPointerCapture", "gotpointercapture"},
      {"topLostPointerCapture", "lostpointercapture"},
      {"topTouchStart", "touchstart"},
      {"topTouchEnd", "touchend"},
      {"topTouchCancel", "touchcancel"},
      {"topKeyDown", "keydown"},
      {"topKeyPress", "keypress"},
      {"topKeyUp", "keyup"},
      {"topBeforeInput", "beforeinput"},
      {"topInput", "input"},
      {"topCompositionStart", "compositionstart"},
      {"topCompositionUpdate", "compositionupdate"},
      {"topCompositionEnd", "compositionend"},
      {"topDragStart", "dragstart"},
      {"topDragEnd", "dragend"},
      {"topDragEnter", "dragenter"},
      {"topDragLeave", "dragleave"},
      {"topDragOver", "dragover"},
      {"topDrop", "drop"},
  };
  return SUPPORTED_EVENTS;
}

EventTag PerformanceEntryReporter::onEventStart(const char* name) {
  if (!isReporting(PerformanceEntryType::EVENT)) {
    return 0;
  }
  const auto& supportedEvents = getSupportedEvents();
  auto it = supportedEvents.find(name);
  if (it == supportedEvents.end()) {
    return 0;
  }

  const char* reportedName = it->second;

  sCurrentEventTag_++;
  if (sCurrentEventTag_ == 0) {
    // The tag wrapped around (which is highly unlikely, but still)
    sCurrentEventTag_ = 1;
  }

  auto timeStamp = getCurrentTimeStamp();
  {
    std::scoped_lock lock(eventsInFlightMutex_);
    eventsInFlight_.emplace(std::make_pair(
        sCurrentEventTag_, EventEntry{reportedName, timeStamp, 0.0}));
  }
  return sCurrentEventTag_;
}

void PerformanceEntryReporter::onEventDispatch(EventTag tag) {
  if (!isReporting(PerformanceEntryType::EVENT) || tag == 0) {
    return;
  }
  auto timeStamp = getCurrentTimeStamp();
  {
    std::scoped_lock lock(eventsInFlightMutex_);
    auto it = eventsInFlight_.find(tag);
    if (it != eventsInFlight_.end()) {
      it->second.dispatchTime = timeStamp;
    }
  }
}

void PerformanceEntryReporter::onEventEnd(EventTag tag) {
  if (!isReporting(PerformanceEntryType::EVENT) || tag == 0) {
    return;
  }
  auto timeStamp = getCurrentTimeStamp();
  {
    std::scoped_lock lock(eventsInFlightMutex_);
    auto it = eventsInFlight_.find(tag);
    if (it == eventsInFlight_.end()) {
      return;
    }
    auto& entry = it->second;
    auto& name = entry.name;

    // TODO: Define the way to assign interaction IDs to the event chains
    // (T141358175)
    const uint32_t interactionId = 0;
    event(
        name,
        entry.startTime,
        timeStamp - entry.startTime,
        entry.dispatchTime,
        timeStamp,
        interactionId);
    eventsInFlight_.erase(it);
  }
}

} // namespace facebook::react
