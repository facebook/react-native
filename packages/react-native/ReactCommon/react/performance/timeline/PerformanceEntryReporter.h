/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PerformanceEntryCircularBuffer.h"
#include "PerformanceEntryKeyedBuffer.h"
#include "PerformanceObserverRegistry.h"

#include <jsinspector-modern/tracing/CdpTracing.h>
#include <react/timing/primitives.h>

#include <memory>
#include <optional>
#include <shared_mutex>
#include <vector>

namespace facebook::react {

// Aligned with maxBufferSize implemented by browsers
// https://w3c.github.io/timing-entrytypes-registry/#registry
constexpr size_t EVENT_BUFFER_SIZE = 150;
constexpr size_t LONG_TASK_BUFFER_SIZE = 200;
constexpr size_t RESOURCE_TIMING_BUFFER_SIZE = 250;

constexpr HighResDuration LONG_TASK_DURATION_THRESHOLD =
    HighResDuration::fromMilliseconds(50);

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

  std::vector<PerformanceEntry> getEntries() const;
  void getEntries(std::vector<PerformanceEntry>& dest) const;

  std::vector<PerformanceEntry> getEntries(
      PerformanceEntryType entryType) const;
  void getEntries(
      std::vector<PerformanceEntry>& dest,
      PerformanceEntryType entryType) const;

  std::vector<PerformanceEntry> getEntries(
      PerformanceEntryType entryType,
      const std::string& entryName) const;
  void getEntries(
      std::vector<PerformanceEntry>& dest,
      PerformanceEntryType entryType,
      const std::string& entryName) const;

  void clearEntries();
  void clearEntries(PerformanceEntryType entryType);
  void clearEntries(
      PerformanceEntryType entryType,
      const std::string& entryName);

  HighResTimeStamp getCurrentTimeStamp() const;

  void setTimeStampProvider(std::function<HighResTimeStamp()> provider) {
    timeStampProvider_ = std::move(provider);
  }

  static std::vector<PerformanceEntryType> getSupportedEntryTypes();

  uint32_t getDroppedEntriesCount(PerformanceEntryType type) const noexcept;

  const std::unordered_map<std::string, uint32_t>& getEventCounts() const {
    return eventCounts_;
  }

  std::optional<HighResTimeStamp> getMarkTime(
      const std::string& markName) const;

  PerformanceMark reportMark(
      const std::string& name,
      const std::optional<HighResTimeStamp>& startTime = std::nullopt);

  PerformanceMeasure reportMeasure(
      const std::string& name,
      HighResTimeStamp startTime,
      HighResTimeStamp endTime,
      const std::optional<jsinspector_modern::DevToolsTrackEntryPayload>&
          trackMetadata = std::nullopt);

  void reportEvent(
      std::string name,
      HighResTimeStamp startTime,
      HighResDuration duration,
      HighResTimeStamp processingStart,
      HighResTimeStamp processingEnd,
      uint32_t interactionId);

  void reportLongTask(HighResTimeStamp startTime, HighResDuration duration);

  PerformanceResourceTiming reportResourceTiming(
      const std::string& url,
      HighResTimeStamp fetchStart,
      HighResTimeStamp requestStart,
      std::optional<HighResTimeStamp> connectStart,
      std::optional<HighResTimeStamp> connectEnd,
      HighResTimeStamp responseStart,
      HighResTimeStamp responseEnd,
      const std::optional<int>& responseStatus);

 private:
  std::unique_ptr<PerformanceObserverRegistry> observerRegistry_;

  mutable std::shared_mutex buffersMutex_;
  PerformanceEntryCircularBuffer eventBuffer_{EVENT_BUFFER_SIZE};
  PerformanceEntryCircularBuffer longTaskBuffer_{LONG_TASK_BUFFER_SIZE};
  PerformanceEntryCircularBuffer resourceTimingBuffer_{
      RESOURCE_TIMING_BUFFER_SIZE};
  PerformanceEntryKeyedBuffer markBuffer_;
  PerformanceEntryKeyedBuffer measureBuffer_;

  std::unordered_map<std::string, uint32_t> eventCounts_;

  std::function<HighResTimeStamp()> timeStampProvider_ = nullptr;

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
      case PerformanceEntryType::RESOURCE:
        return resourceTimingBuffer_;
      case PerformanceEntryType::_NEXT:
        throw std::logic_error("Cannot get buffer for _NEXT entry type");
    }
    throw std::logic_error("Unhandled PerformanceEntryType");
  }

  inline PerformanceEntryBuffer& getBufferRef(PerformanceEntryType entryType) {
    switch (entryType) {
      case PerformanceEntryType::EVENT:
        return eventBuffer_;
      case PerformanceEntryType::MARK:
        return markBuffer_;
      case PerformanceEntryType::MEASURE:
        return measureBuffer_;
      case PerformanceEntryType::LONGTASK:
        return longTaskBuffer_;
      case PerformanceEntryType::RESOURCE:
        return resourceTimingBuffer_;
      case PerformanceEntryType::_NEXT:
        throw std::logic_error("Cannot get buffer for _NEXT entry type");
    }
    throw std::logic_error("Unhandled PerformanceEntryType");
  }

  void traceMark(const PerformanceMark& entry) const;
  void traceMeasure(const PerformanceMeasure& entry) const;
};

} // namespace facebook::react
