/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/timing/primitives.h>
#include "PerformanceObserverRegistry.h"
#include "PerformanceEntryCircularBuffer.h"
#include "PerformanceEntryKeyedBuffer.h"

#include <cassert>
#include <memory>
#include <mutex>
#include <optional>

namespace facebook::react {

constexpr size_t MAX_BUFFER_SIZE_EVENT = 150;

constexpr DOMHighResTimeStamp LONG_TASK_DURATION_THRESHOLD_MS = 50.0;

class PerformanceEntryReporter {
 public:
  PerformanceEntryReporter();

  // NOTE: This class is not thread safe, make sure that the calls are made from
  // the same thread.
  // TODO: Consider passing it as a parameter to the corresponding modules at
  // creation time instead of having the singleton.
  static std::shared_ptr<PerformanceEntryReporter>& getInstance();

  [[nodiscard]] PerformanceObserverRegistry& getObserverRegistry() {
    return *observerRegistry_;
  }

  /*
   * DOM Performance (High Resolution Time)
   * https://www.w3.org/TR/hr-time-3/#dom-performance
   */
  // https://www.w3.org/TR/hr-time-3/#now-method
  [[nodiscard]] DOMHighResTimeStamp getCurrentTimeStamp() const;

  void setTimeStampProvider(std::function<double()> provider) {
    timeStampProvider_ = std::move(provider);
  }

  /*
   * Performance Timeline functions
   * https://www.w3.org/TR/performance-timeline
   */
  // https://www.w3.org/TR/performance-timeline/#queue-a-performanceentry
  void pushEntry(const PerformanceEntry& entry);

  // https://www.w3.org/TR/performance-timeline/#getentries-method
  // https://www.w3.org/TR/performance-timeline/#getentriesbytype-method
  // https://www.w3.org/TR/performance-timeline/#getentriesbyname-method
  [[nodiscard]] std::vector<PerformanceEntry> getEntries(
      std::optional<PerformanceEntryType> entryType = std::nullopt,
      std::string_view entryName = {}) const;

  void logEventEntry(
      std::string name,
      double startTime,
      double duration,
      double processingStart,
      double processingEnd,
      uint32_t interactionId);

  void logLongTaskEntry(double startTime, double duration);

  /*
   * Event Timing API functions
   * https://www.w3.org/TR/event-timing/
   */
  // https://www.w3.org/TR/event-timing/#dom-performance-eventcounts
  [[nodiscard]] const std::unordered_map<std::string, uint32_t>& getEventCounts() const {
    return eventCounts_;
  }

  /*
   * User Timing Level 3 functions
   * https://w3c.github.io/user-timing/
   */
  // https://w3c.github.io/user-timing/#mark-method
  void mark(
      const std::string& name,
      const std::optional<DOMHighResTimeStamp>& startTime = std::nullopt);

  // https://w3c.github.io/user-timing/#measure-method
  void measure(
      const std::string_view& name,
      double startTime,
      double endTime,
      const std::optional<double>& duration = std::nullopt,
      const std::optional<std::string>& startMark = std::nullopt,
      const std::optional<std::string>& endMark = std::nullopt);

  // https://w3c.github.io/user-timing/#clearmarks-method
  // https://w3c.github.io/user-timing/#clearmeasures-method
  void clearEntries(
      std::optional<PerformanceEntryType> entryType = std::nullopt,
      std::string_view entryName = {});

  // Instead of having a map of buffers, we store buffer for each type
  // separately
  [[nodiscard]] inline const PerformanceEntryBuffer& getBuffer(
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
      default:
        assert(0 && "Unhandled PerformanceEntryType");
    }
  }

private:
  std::unique_ptr<PerformanceObserverRegistry> observerRegistry_;

  mutable std::mutex entriesMutex_;
  PerformanceEntryCircularBuffer eventBuffer_{MAX_BUFFER_SIZE_EVENT};
  PerformanceEntryCircularBuffer longTaskBuffer_{MAX_BUFFER_SIZE_EVENT};
  PerformanceEntryKeyedBuffer markBuffer_;
  PerformanceEntryKeyedBuffer measureBuffer_;

  std::unordered_map<std::string, uint32_t> eventCounts_;

  std::function<double()> timeStampProvider_ = nullptr;

  double getMarkTime(const std::string& markName) const;

  void getEntries(
      PerformanceEntryType entryType,
      std::string_view entryName,
      std::vector<PerformanceEntry>& res) const;

  [[nodiscard]] inline PerformanceEntryBuffer& getBufferRef(PerformanceEntryType entryType) {
    switch (entryType) {
      case PerformanceEntryType::EVENT:
        return eventBuffer_;
      case PerformanceEntryType::MARK:
        return markBuffer_;
      case PerformanceEntryType::MEASURE:
        return measureBuffer_;
      case PerformanceEntryType::LONGTASK:
        return longTaskBuffer_;
      default:
        assert(0 && "Unhandled PerformanceEntryType");
    }
  }
};

} // namespace facebook::react
