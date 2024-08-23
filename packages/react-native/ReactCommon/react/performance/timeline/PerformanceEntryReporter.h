/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "BoundedConsumableBuffer.h"

#include <array>
#include <functional>
#include <memory>
#include <mutex>
#include <optional>
#include <string_view>
#include <unordered_map>
#include <unordered_set>

namespace facebook::react {

using DOMHighResTimeStamp = double;

using PerformanceEntryInteractionId = uint32_t;

enum class PerformanceEntryType {
  // We need to preserve these values for backwards compatibility.
  MARK = 1,
  MEASURE = 2,
  EVENT = 3,
  _NEXT = 4,
};

struct PerformanceEntry {
  std::string name;
  PerformanceEntryType entryType;
  DOMHighResTimeStamp startTime;
  DOMHighResTimeStamp duration = 0;

  // For "event" entries only:
  std::optional<DOMHighResTimeStamp> processingStart;
  std::optional<DOMHighResTimeStamp> processingEnd;
  std::optional<PerformanceEntryInteractionId> interactionId;
};

struct PerformanceEntryHash {
  size_t operator()(const PerformanceEntry* entry) const {
    return std::hash<std::string>()(entry->name);
  }
};

struct PerformanceEntryEqual {
  bool operator()(const PerformanceEntry* lhs, const PerformanceEntry* rhs)
      const {
    return lhs->name == rhs->name;
  }
};

using PerformanceEntryRegistryType = std::unordered_set<
    const PerformanceEntry*,
    PerformanceEntryHash,
    PerformanceEntryEqual>;

// Default duration threshold for reporting performance entries (0 means "report
// all")
constexpr double DEFAULT_DURATION_THRESHOLD = 0.0;

// Default buffer size limit, per entry type
constexpr size_t DEFAULT_MAX_BUFFER_SIZE = 1024;

struct PerformanceEntryBuffer {
  BoundedConsumableBuffer<PerformanceEntry> entries{DEFAULT_MAX_BUFFER_SIZE};
  bool isReporting{false};
  bool isAlwaysLogged{false};
  double durationThreshold{DEFAULT_DURATION_THRESHOLD};
  bool hasNameLookup{false};
  PerformanceEntryRegistryType nameLookup;
};

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
    return buffers_[static_cast<int>(entryType) - 1];
  }

  const PerformanceEntryBuffer& getBuffer(
      PerformanceEntryType entryType) const {
    return buffers_[static_cast<int>(entryType) - 1];
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
  std::array<PerformanceEntryBuffer, NUM_PERFORMANCE_ENTRY_TYPES> buffers_;
  std::unordered_map<std::string, uint32_t> eventCounts_;

  uint32_t droppedEntriesCount_{0};

  std::function<double()> timeStampProvider_ = nullptr;

  mutable std::mutex nameLookupMutex_;

  double getMarkTime(const std::string& markName) const;
  void scheduleFlushBuffer();

  void getEntries(
      PerformanceEntryType entryType,
      std::string_view entryName,
      std::vector<PerformanceEntry>& res) const;
};

} // namespace facebook::react
