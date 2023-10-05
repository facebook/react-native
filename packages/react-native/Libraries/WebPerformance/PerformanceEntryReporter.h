/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Function.h>
#include <react/renderer/core/EventLogger.h>
#include <array>
#include <functional>
#include <mutex>
#include <optional>
#include <string_view>
#include <unordered_map>
#include <unordered_set>
#include "BoundedConsumableBuffer.h"
#include "NativePerformanceObserver.h"

namespace facebook::react {

struct PerformanceEntryHash {
  size_t operator()(const RawPerformanceEntry* entry) const {
    return std::hash<std::string>()(entry->name);
  }
};

struct PerformanceEntryEqual {
  bool operator()(
      const RawPerformanceEntry* lhs,
      const RawPerformanceEntry* rhs) const {
    return lhs->name == rhs->name;
  }
};

using PerformanceEntryRegistryType = std::unordered_set<
    const RawPerformanceEntry*,
    PerformanceEntryHash,
    PerformanceEntryEqual>;

// Default duration threshold for reporting performance entries (0 means "report
// all")
constexpr double DEFAULT_DURATION_THRESHOLD = 0.0;

// Default buffer size limit, per entry type
constexpr size_t DEFAULT_MAX_BUFFER_SIZE = 1024;

struct PerformanceEntryBuffer {
  BoundedConsumableBuffer<RawPerformanceEntry> entries{DEFAULT_MAX_BUFFER_SIZE};
  bool isReporting{false};
  bool isAlwaysLogged{false};
  double durationThreshold{DEFAULT_DURATION_THRESHOLD};
  bool hasNameLookup{false};
  PerformanceEntryRegistryType nameLookup;
};

enum class PerformanceEntryType {
  UNDEFINED = 0,
  MARK = 1,
  MEASURE = 2,
  EVENT = 3,
  _COUNT = 4,
};

constexpr size_t NUM_PERFORMANCE_ENTRY_TYPES =
    (size_t)PerformanceEntryType::_COUNT;

class PerformanceEntryReporter : public EventLogger {
 public:
  PerformanceEntryReporter(const PerformanceEntryReporter&) = delete;
  void operator=(const PerformanceEntryReporter&) = delete;

  // NOTE: This class is not thread safe, make sure that the calls are made from
  // the same thread.
  // TODO: Consider passing it as a parameter to the corresponding modules at
  // creation time instead of having the singleton.
  static PerformanceEntryReporter& getInstance();

  void setReportingCallback(std::optional<AsyncCallback<>> callback);
  void startReporting(PerformanceEntryType entryType);
  void stopReporting(PerformanceEntryType entryType);
  void stopReporting();
  void setAlwaysLogged(PerformanceEntryType entryType, bool isAlwaysLogged);
  void setDurationThreshold(
      PerformanceEntryType entryType,
      double durationThreshold);

  GetPendingEntriesResult popPendingEntries();

  void logEntry(const RawPerformanceEntry& entry);

  PerformanceEntryBuffer& getBuffer(PerformanceEntryType entryType) {
    return buffers_[static_cast<int>(entryType)];
  }

  const PerformanceEntryBuffer& getBuffer(
      PerformanceEntryType entryType) const {
    return buffers_[static_cast<int>(entryType)];
  }

  bool isReporting(PerformanceEntryType entryType) const {
    return getBuffer(entryType).isReporting;
  }

  bool isAlwaysLogged(PerformanceEntryType entryType) const {
    return getBuffer(entryType).isAlwaysLogged;
  }

  uint32_t getDroppedEntryCount() const {
    return droppedEntryCount_;
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
      PerformanceEntryType entryType = PerformanceEntryType::UNDEFINED,
      std::string_view entryName = {});

  std::vector<RawPerformanceEntry> getEntries(
      PerformanceEntryType entryType = PerformanceEntryType::UNDEFINED,
      std::string_view entryName = {}) const;

  void event(
      std::string name,
      double startTime,
      double duration,
      double processingStart,
      double processingEnd,
      uint32_t interactionId);

  EventTag onEventStart(std::string_view name) override;
  void onEventDispatch(EventTag tag) override;
  void onEventEnd(EventTag tag) override;

  const std::unordered_map<std::string, uint32_t>& getEventCounts() const {
    return eventCounts_;
  }

  void setTimeStampProvider(std::function<double()> provider) {
    timeStampProvider_ = provider;
  }

 private:
  std::optional<AsyncCallback<>> callback_;

  mutable std::mutex entriesMutex_;
  std::array<PerformanceEntryBuffer, NUM_PERFORMANCE_ENTRY_TYPES> buffers_;
  std::unordered_map<std::string, uint32_t> eventCounts_;

  uint32_t droppedEntryCount_{0};

  struct EventEntry {
    std::string_view name;
    double startTime{0.0};
    double dispatchTime{0.0};
  };

  // Registry to store the events that are currently ongoing.
  // Note that we could probably use a more efficient container for that,
  // but since we only report discrete events, the volume is normally low,
  // so a hash map should be just fine.
  std::unordered_map<EventTag, EventEntry> eventsInFlight_;
  mutable std::mutex eventsInFlightMutex_;

  std::function<double()> timeStampProvider_ = nullptr;

  mutable std::mutex nameLookupMutex_;

  static EventTag sCurrentEventTag_;

  PerformanceEntryReporter();

  double getMarkTime(const std::string& markName) const;
  void scheduleFlushBuffer();

  void getEntries(
      PerformanceEntryType entryType,
      std::string_view entryName,
      std::vector<RawPerformanceEntry>& res) const;

  double getCurrentTimeStamp() const;
};

} // namespace facebook::react
