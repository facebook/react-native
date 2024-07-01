/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PerformanceEntryBuffer.h"

#include <array>
#include <cassert>
#include <functional>
#include <memory>
#include <mutex>
#include <optional>

namespace facebook::react {

// Default buffer size limit, per entry type
constexpr size_t DEFAULT_MAX_BUFFER_SIZE = 1024;
constexpr size_t MAX_BUFFER_SIZE_EVENT = 150;

constexpr size_t NUM_PERFORMANCE_ENTRY_TYPES =
    (size_t)PerformanceEntryType::_NEXT - 1; // Valid types start from 1.

class PerformanceEntryReporter {
 public:
  PerformanceEntryReporter();

  // NOTE: This class is not thread safe, make sure that the calls are made from
  // the same thread.
  // TODO: Consider passing it as a parameter to the corresponding modules at
  // creation time instead of having the singleton.
  static std::shared_ptr<PerformanceEntryReporter>& getInstance();

  struct PopPendingEntriesResult {
    std::vector<PerformanceEntry> entries;
    uint32_t droppedEntriesCount;
  };

  void setReportingCallback(std::function<void()> callback);
  void startReporting(PerformanceEntryType entryType);
  void stopReporting(PerformanceEntryType entryType);
  void stopReporting();
  void setAlwaysLogged(PerformanceEntryType entryType, bool isAlwaysLogged);
  void setDurationThreshold(
      PerformanceEntryType entryType,
      double durationThreshold);

  PopPendingEntriesResult popPendingEntries();

  void logEntry(const PerformanceEntry& entry);

  PerformanceEntryBuffer& getBuffer(PerformanceEntryType entryType) {
    switch (entryType) {
      case PerformanceEntryType::EVENT:
        return eventBuffer_;
      case PerformanceEntryType::MARK:
        return markBuffer_;
      case PerformanceEntryType::MEASURE:
        return measureBuffer_;
      default:
        assert(0 && "Unhandled PerformanceEntryType");
    }
  }

  const PerformanceEntryBuffer& getBuffer(
      PerformanceEntryType entryType) const {
    switch (entryType) {
      case PerformanceEntryType::EVENT:
        return eventBuffer_;
      case PerformanceEntryType::MARK:
        return markBuffer_;
      case PerformanceEntryType::MEASURE:
        return measureBuffer_;
      default:
        assert(0 && "Unhandled PerformanceEntryType");
    }
  }

  bool isReporting(PerformanceEntryType entryType) const {
    return getBuffer(entryType).isReporting;
  }

  bool isAlwaysLogged(PerformanceEntryType entryType) const {
    return getBuffer(entryType).isAlwaysLogged;
  }

  uint32_t getDroppedEntriesCount() const {
    return droppedEntriesCount_;
  }

  void mark(
      const std::string& name,
      const std::optional<double>& startTime = std::nullopt);

  void measure(
      const std::string& name,
      double startTime,
      double endTime,
      const std::optional<double>& duration = std::nullopt,
      const std::optional<std::string>& startMark = std::nullopt,
      const std::optional<std::string>& endMark = std::nullopt);

  void clearEntries(
      std::optional<PerformanceEntryType> entryType = std::nullopt,
      std::string_view entryName = {});

  std::vector<PerformanceEntry> getEntries(
      std::optional<PerformanceEntryType> entryType = std::nullopt,
      std::string_view entryName = {}) const;

  void logEventEntry(
      std::string name,
      double startTime,
      double duration,
      double processingStart,
      double processingEnd,
      uint32_t interactionId);

  const std::unordered_map<std::string, uint32_t>& getEventCounts() const {
    return eventCounts_;
  }

  DOMHighResTimeStamp getCurrentTimeStamp() const;

  void setTimeStampProvider(std::function<double()> provider) {
    timeStampProvider_ = std::move(provider);
  }

 private:
  std::function<void()> callback_;

  mutable std::mutex entriesMutex_;
  PerformanceEntryCircularBuffer eventBuffer_{MAX_BUFFER_SIZE_EVENT};
  PerformanceEntryKeyedBuffer markBuffer_;
  PerformanceEntryKeyedBuffer measureBuffer_;

  std::unordered_map<std::string, uint32_t> eventCounts_;

  uint32_t droppedEntriesCount_{0};

  std::function<double()> timeStampProvider_ = nullptr;

  double getMarkTime(const std::string& markName) const;
  void scheduleFlushBuffer();

  void getEntries(
      PerformanceEntryType entryType,
      std::string_view entryName,
      std::vector<PerformanceEntry>& res) const;
};

} // namespace facebook::react
