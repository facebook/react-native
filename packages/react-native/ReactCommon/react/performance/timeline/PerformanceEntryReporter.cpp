/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryReporter.h"

#include <cxxreact/JSExecutor.h>

namespace facebook::react {

std::shared_ptr<PerformanceEntryReporter>&
PerformanceEntryReporter::getInstance() {
  static auto instance = std::make_shared<PerformanceEntryReporter>();
  return instance;
}

PerformanceEntryReporter::PerformanceEntryReporter()
    : observerRegistry_(std::make_unique<PerformanceObserverRegistry>()) {}

#pragma mark - DOM Performance (High Resolution Time) (https://www.w3.org/TR/hr-time-3/#dom-performance)

DOMHighResTimeStamp PerformanceEntryReporter::getCurrentTimeStamp() const {
  return timeStampProvider_ != nullptr ? timeStampProvider_()
                                       : JSExecutor::performanceNow();
}

#pragma mark - Performance Timeline (https://w3c.github.io/performance-timeline/)

uint32_t PerformanceEntryReporter::getDroppedEntriesCount(
    PerformanceEntryType type) const noexcept {
  return getBuffer(type).droppedEntriesCount;
}

void PerformanceEntryReporter::clearEntries(
    std::optional<PerformanceEntryType> entryType,
    std::optional<std::string_view> entryName) {
  std::lock_guard lock(buffersMutex_);

  // Clear all entry types
  if (!entryType) {
    if (entryName.has_value()) {
      markBuffer_.clear(*entryName);
      measureBuffer_.clear(*entryName);
      eventBuffer_.clear(*entryName);
      longTaskBuffer_.clear(*entryName);
    } else {
      markBuffer_.clear();
      measureBuffer_.clear();
      eventBuffer_.clear();
      longTaskBuffer_.clear();
    }
    return;
  }

  auto& buffer = getBufferRef(*entryType);
  if (entryName.has_value()) {
    buffer.clear(*entryName);
  } else {
    buffer.clear();
  }
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntries() const {
  std::vector<PerformanceEntry> res;
  // Collect all entry types
  for (int i = 1; i <= NUM_PERFORMANCE_ENTRY_TYPES; i++) {
    getBuffer(static_cast<PerformanceEntryType>(i)).getEntries(res);
  }
  return res;
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntriesByType(
    PerformanceEntryType entryType) const {
  std::vector<PerformanceEntry> res;
  getEntriesByType(entryType, res);
  return res;
}

void PerformanceEntryReporter::getEntriesByType(
    PerformanceEntryType entryType,
    std::vector<PerformanceEntry>& target) const {
  getBuffer(entryType).getEntries(target);
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntriesByName(
    std::string_view entryName) const {
  std::vector<PerformanceEntry> res;
  // Collect all entry types
  for (int i = 1; i <= NUM_PERFORMANCE_ENTRY_TYPES; i++) {
    getBuffer(static_cast<PerformanceEntryType>(i)).getEntries(entryName, res);
  }
  return res;
}

std::vector<PerformanceEntry> PerformanceEntryReporter::getEntriesByName(
    std::string_view entryName,
    PerformanceEntryType entryType) const {
  std::vector<PerformanceEntry> res;
  getBuffer(entryType).getEntries(entryName, res);
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
    const std::string_view& name,
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
    std::string name,
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
