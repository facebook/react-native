/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryReporter.h"

#include <cxxreact/JSExecutor.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <algorithm>
#include <array>

namespace facebook::react {

namespace {
std::unordered_set<PerformanceEntryType> getSupportedEntryTypesInternal() {
  std::unordered_set supportedEntryTypes{
      PerformanceEntryType::MARK,
      PerformanceEntryType::MEASURE,
      PerformanceEntryType::EVENT,
  };

  if (ReactNativeFeatureFlags::enableLongTaskAPI()) {
    supportedEntryTypes.emplace(PerformanceEntryType::LONGTASK);
  }

  return supportedEntryTypes;
}

const std::array<PerformanceEntryType, 2> ENTRY_TYPES_AVAILABLE_FROM_TIMELINE{
    {PerformanceEntryType::MARK, PerformanceEntryType::MEASURE}};

bool isAvailableFromTimeline(PerformanceEntryType entryType) {
  return entryType == PerformanceEntryType::MARK ||
      entryType == PerformanceEntryType::MEASURE;
}
} // namespace

std::shared_ptr<PerformanceEntryReporter>&
PerformanceEntryReporter::getInstance() {
  static auto instance = std::make_shared<PerformanceEntryReporter>();
  return instance;
}

PerformanceEntryReporter::PerformanceEntryReporter()
    : observerRegistry_(std::make_unique<PerformanceObserverRegistry>()) {}

std::vector<PerformanceEntry> PerformanceEntryReporter::getBufferedEntries(
    PerformanceEntryType entryType) const {
  std::vector<PerformanceEntry> res;
  getBuffer(entryType).getEntries(res);
  return res;
}

void PerformanceEntryReporter::clearEntries() {
  std::lock_guard lock(buffersMutex_);

  markBuffer_.clear();
  measureBuffer_.clear();
  eventBuffer_.clear();
  longTaskBuffer_.clear();
}

#pragma mark - DOM Performance (High Resolution Time) (https://www.w3.org/TR/hr-time-3/#dom-performance)

DOMHighResTimeStamp PerformanceEntryReporter::getCurrentTimeStamp() const {
  return timeStampProvider_ != nullptr ? timeStampProvider_()
                                       : JSExecutor::performanceNow();
}

#pragma mark - Performance Timeline (https://w3c.github.io/performance-timeline/)

std::unordered_set<PerformanceEntryType>
PerformanceEntryReporter::getSupportedEntryTypes() {
  static std::unordered_set supportedEntries = getSupportedEntryTypesInternal();
  return supportedEntries;
}

uint32_t PerformanceEntryReporter::getDroppedEntriesCount(
    PerformanceEntryType type) const noexcept {
  return getBuffer(type).droppedEntriesCount;
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntries() const {
  std::vector<PerformanceEntry> res;

  for (auto entryType : ENTRY_TYPES_AVAILABLE_FROM_TIMELINE) {
    getBuffer(entryType).getEntries(res);
  }

  std::stable_sort(res.begin(), res.end(), PerformanceEntrySorter{});

  return res;
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntriesByType(
    PerformanceEntryType entryType) const {
  std::vector<PerformanceEntry> res;

  if (isAvailableFromTimeline(entryType)) {
    getBuffer(entryType).getEntries(res);
  }

  std::stable_sort(res.begin(), res.end(), PerformanceEntrySorter{});

  return res;
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntriesByName(
    const std::string& entryName,
    const std::optional<PerformanceEntryType>& entryType) const {
  std::vector<PerformanceEntry> res;

  if (entryType) {
    if (isAvailableFromTimeline(*entryType)) {
      getBuffer(*entryType).getEntries(entryName, res);
    }
  } else {
    for (auto type : ENTRY_TYPES_AVAILABLE_FROM_TIMELINE) {
      getBuffer(type).getEntries(entryName, res);
    }
  }

  std::stable_sort(res.begin(), res.end(), PerformanceEntrySorter{});

  return res;
}

#pragma mark - User Timing Level 3 functions (https://w3c.github.io/user-timing/)

void PerformanceEntryReporter::reportMark(
    const std::string& name,
    const std::optional<DOMHighResTimeStamp>& startTime) {
  const auto entry = PerformanceEntry{
      .name = name,
      .entryType = PerformanceEntryType::MARK,
      .startTime = startTime ? *startTime : getCurrentTimeStamp()};

  {
    std::lock_guard lock(buffersMutex_);
    markBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

void PerformanceEntryReporter::reportMeasure(
    const std::string& name,
    DOMHighResTimeStamp startTime,
    DOMHighResTimeStamp endTime,
    const std::optional<DOMHighResTimeStamp>& duration,
    const std::optional<std::string>& startMark,
    const std::optional<std::string>& endMark) {
  DOMHighResTimeStamp startTimeVal =
      startMark ? getMarkTime(*startMark) : startTime;
  DOMHighResTimeStamp endTimeVal = endMark ? getMarkTime(*endMark) : endTime;

  if (!endMark && endTime < startTimeVal) {
    // The end time is not specified, take the current time, according to the
    // standard
    endTimeVal = getCurrentTimeStamp();
  }

  DOMHighResTimeStamp durationVal =
      duration ? *duration : endTimeVal - startTimeVal;

  const auto entry = PerformanceEntry{
      .name = std::string(name),
      .entryType = PerformanceEntryType::MEASURE,
      .startTime = startTimeVal,
      .duration = durationVal};

  {
    std::lock_guard lock(buffersMutex_);
    measureBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

void PerformanceEntryReporter::clearMarks(
    const std::optional<std::string>& entryName) {
  std::lock_guard lock(buffersMutex_);

  if (entryName) {
    markBuffer_.clear(*entryName);
  } else {
    markBuffer_.clear();
  }
}

void PerformanceEntryReporter::clearMeasures(
    const std::optional<std::string>& entryName) {
  std::lock_guard lock(buffersMutex_);

  if (entryName) {
    measureBuffer_.clear(*entryName);
  } else {
    measureBuffer_.clear();
  }
}

DOMHighResTimeStamp PerformanceEntryReporter::getMarkTime(
    const std::string& markName) const {
  std::lock_guard lock(buffersMutex_);

  if (auto it = markBuffer_.find(markName); it) {
    return it->startTime;
  } else {
    return 0.0;
  }
}

#pragma mark - Event Timing API functions (https://www.w3.org/TR/event-timing/)

void PerformanceEntryReporter::reportEvent(
    const std::string& name,
    DOMHighResTimeStamp startTime,
    DOMHighResTimeStamp duration,
    DOMHighResTimeStamp processingStart,
    DOMHighResTimeStamp processingEnd,
    uint32_t interactionId) {
  eventCounts_[name]++;

  const auto entry = PerformanceEntry{
      .name = std::move(name),
      .entryType = PerformanceEntryType::EVENT,
      .startTime = startTime,
      .duration = duration,
      .processingStart = processingStart,
      .processingEnd = processingEnd,
      .interactionId = interactionId};

  {
    std::lock_guard lock(buffersMutex_);

    if (entry.duration < eventBuffer_.durationThreshold) {
      // The entries duration is lower than the desired reporting threshold,
      // skip
      return;
    }

    eventBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

#pragma mark - Long Tasks API functions (https://w3c.github.io/longtasks/)

void PerformanceEntryReporter::reportLongTask(
    DOMHighResTimeStamp startTime,
    DOMHighResTimeStamp duration) {
  const auto entry = PerformanceEntry{
      .name = std::string{"self"},
      .entryType = PerformanceEntryType::LONGTASK,
      .startTime = startTime,
      .duration = duration};

  {
    std::lock_guard lock(buffersMutex_);
    longTaskBuffer_.add(entry);
  }

  observerRegistry_->queuePerformanceEntry(entry);
}

} // namespace facebook::react
