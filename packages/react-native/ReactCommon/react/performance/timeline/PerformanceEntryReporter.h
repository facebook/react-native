/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/timing/primitives.h>
#include <memory>
#include <mutex>
#include <optional>
#include "PerformanceEntryCircularBuffer.h"
#include "PerformanceEntryKeyedBuffer.h"
#include "PerformanceObserverRegistry.h"

namespace facebook::react {

constexpr size_t EVENT_BUFFER_SIZE = 150;
constexpr size_t LONG_TASK_BUFFER_SIZE = 200;

constexpr DOMHighResTimeStamp LONG_TASK_DURATION_THRESHOLD_MS = 50.0;

class PerformanceEntryReporter {
 public:
  PerformanceEntryReporter();

  // NOTE: This class is not thread safe, make sure that the calls are made from
  // the same thread.
  // TODO: Consider passing it as a parameter to the corresponding modules at
  // creation time instead of having the singleton.
  static std::shared_ptr<PerformanceEntryReporter>& getInstance();

  PerformanceObserverRegistry& getObserverRegistry() {
    return *observerRegistry_;
  }

  std::vector<PerformanceEntry> getBufferedEntries(
      PerformanceEntryType entryType) const;

  void clearEntries();

#pragma mark - DOM Performance (High Resolution Time) (https://www.w3.org/TR/hr-time-3/#dom-performance)

  // https://www.w3.org/TR/hr-time-3/#now-method
  DOMHighResTimeStamp getCurrentTimeStamp() const;

  void setTimeStampProvider(std::function<DOMHighResTimeStamp()> provider) {
    timeStampProvider_ = std::move(provider);
  }

#pragma mark - Performance Timeline (https://w3c.github.io/performance-timeline/)

  static std::unordered_set<PerformanceEntryType> getSupportedEntryTypes();

  // https://www.w3.org/TR/performance-timeline/#dom-performanceobservercallbackoptions-droppedentriescount
  uint32_t getDroppedEntriesCount(PerformanceEntryType type) const noexcept;

  // https://www.w3.org/TR/performance-timeline/#getentries-method
  std::vector<PerformanceEntry> getEntries() const;

  // https://www.w3.org/TR/performance-timeline/#getentriesbytype-method
  std::vector<PerformanceEntry> getEntriesByType(
      PerformanceEntryType entryType) const;
  void getEntriesByType(
      PerformanceEntryType entryType,
      std::vector<PerformanceEntry>& target) const;

  // https://www.w3.org/TR/performance-timeline/#getentriesbyname-method
  std::vector<PerformanceEntry> getEntriesByName(
      std::string_view entryName,
      std::optional<PerformanceEntryType> entryType = std::nullopt) const;

#pragma mark - User Timing Level 3 functions (https://w3c.github.io/user-timing/)

  // https://w3c.github.io/user-timing/#mark-method
  void reportMark(
      const std::string& name,
      const std::optional<DOMHighResTimeStamp>& startTime = std::nullopt);

  // https://w3c.github.io/user-timing/#measure-method
  void reportMeasure(
      const std::string_view& name,
      double startTime,
      double endTime,
      const std::optional<double>& duration = std::nullopt,
      const std::optional<std::string>& startMark = std::nullopt,
      const std::optional<std::string>& endMark = std::nullopt);

  // https://w3c.github.io/user-timing/#clearmarks-method
  void clearMarks(std::optional<std::string_view> entryName = std::nullopt);

  // https://w3c.github.io/user-timing/#clearmeasures-method
  void clearMeasures(std::optional<std::string_view> entryName = std::nullopt);

#pragma mark - Event Timing API functions (https://www.w3.org/TR/event-timing/)

  void reportEvent(
      std::string name,
      double startTime,
      double duration,
      double processingStart,
      double processingEnd,
      uint32_t interactionId);

  // https://www.w3.org/TR/event-timing/#dom-performance-eventcounts
  const std::unordered_map<std::string, uint32_t>& getEventCounts() const {
    return eventCounts_;
  }

#pragma mark - Long Tasks API functions (https://w3c.github.io/longtasks/)

  void reportLongTask(double startTime, double duration);

 private:
  std::unique_ptr<PerformanceObserverRegistry> observerRegistry_;

  mutable std::mutex buffersMutex_;
  PerformanceEntryCircularBuffer eventBuffer_{EVENT_BUFFER_SIZE};
  PerformanceEntryCircularBuffer longTaskBuffer_{LONG_TASK_BUFFER_SIZE};
  PerformanceEntryKeyedBuffer markBuffer_;
  PerformanceEntryKeyedBuffer measureBuffer_;

  std::unordered_map<std::string, uint32_t> eventCounts_;

  std::function<double()> timeStampProvider_ = nullptr;

  double getMarkTime(const std::string& markName) const;

  const inline PerformanceEntryBuffer& getBuffer(
      PerformanceEntryType entryType) const {
    switch (entryType) {
      case PerformanceEntryType::EVENT:
        return eventBuffer_;
      case PerformanceEntryType::MARK:
        return markBuffer_;
      case PerformanceEntryType::MEASURE:
        return measureBuffer_;
      case PerformanceEntryType::LONGTASK:
        return longTaskBuffer_;
      case PerformanceEntryType::_NEXT:
        throw std::logic_error("Cannot get buffer for _NEXT entry type");
    }
  }
};

} // namespace facebook::react
