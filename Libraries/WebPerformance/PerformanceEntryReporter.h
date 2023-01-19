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
#include <unordered_map>
#include <unordered_set>
#include "NativePerformanceObserver.h"

namespace facebook::react {

struct PerformanceMark {
  std::string name;
  double timeStamp;
};

struct PerformanceMarkHash {
  size_t operator()(const PerformanceMark *mark) const {
    return std::hash<std::string>()(mark->name);
  }
};

struct PerformanceMarkEqual {
  bool operator()(const PerformanceMark *lhs, const PerformanceMark *rhs)
      const {
    return lhs->name == rhs->name;
  }
};

using PerformanceMarkRegistryType = std::
    unordered_set<PerformanceMark *, PerformanceMarkHash, PerformanceMarkEqual>;

// Only the MARKS_BUFFER_SIZE amount of the latest marks will be kept in
// memory for the sake of the "Performance.measure" mark name lookup
constexpr size_t MARKS_BUFFER_SIZE = 1024;

enum class PerformanceEntryType {
  UNDEFINED = 0,
  MARK = 1,
  MEASURE = 2,
  EVENT = 3,
  _COUNT = 4,
};

class PerformanceEntryReporter : public EventLogger {
 public:
  PerformanceEntryReporter(PerformanceEntryReporter const &) = delete;
  void operator=(PerformanceEntryReporter const &) = delete;

  // NOTE: This class is not thread safe, make sure that the calls are made from
  // the same thread.
  // TODO: Consider passing it as a parameter to the corresponding modules at
  // creation time instead of having the singleton.
  static PerformanceEntryReporter &getInstance();

  void setReportingCallback(std::optional<AsyncCallback<>> callback);
  void startReporting(PerformanceEntryType entryType);
  void stopReporting(PerformanceEntryType entryType);

  GetPendingEntriesResult popPendingEntries();
  void logEntry(const RawPerformanceEntry &entry);

  bool isReportingType(PerformanceEntryType entryType) const {
    return reportingType_[static_cast<int>(entryType)];
  }

  uint32_t getDroppedEntryCount() const {
    return droppedEntryCount_;
  }

  void mark(const std::string &name, double startTime, double duration);
  void clearMarks(const std::optional<std::string> &markName);

  void measure(
      const std::string &name,
      double startTime,
      double endTime,
      const std::optional<double> &duration,
      const std::optional<std::string> &startMark,
      const std::optional<std::string> &endMark);
  void clearMeasures(const std::optional<std::string> &measureName);

  void event(
      std::string name,
      double startTime,
      double duration,
      double processingStart,
      double processingEnd,
      uint32_t interactionId);

  EventTag onEventStart(const char *name) override;
  void onEventDispatch(EventTag tag) override;
  void onEventEnd(EventTag tag) override;

 private:
  PerformanceEntryReporter() {}

  double getMarkTime(const std::string &markName) const;
  void clearEntries(std::function<bool(const RawPerformanceEntry &)> predicate);
  void scheduleFlushBuffer();

  bool isReportingEvents() const {
    return isReportingType(PerformanceEntryType::EVENT);
  }

  std::optional<AsyncCallback<>> callback_;
  std::vector<RawPerformanceEntry> entries_;
  std::mutex entriesMutex_;
  std::array<bool, (size_t)PerformanceEntryType::_COUNT> reportingType_{false};

  // Mark registry for "measure" lookup
  PerformanceMarkRegistryType marksRegistry_;
  std::array<PerformanceMark, MARKS_BUFFER_SIZE> marksBuffer_;
  size_t marksBufferPosition_{0};
  uint32_t droppedEntryCount_{0};

  struct EventEntry {
    const char *name;
    double startTime{0.0};
    double dispatchTime{0.0};
  };

  // Registry to store the events that are currently ongoing.
  // Note that we could probably use a more efficient container for that,
  // but since we only report discrete events, the volume is normally low,
  // so a hash map should be just fine.
  std::unordered_map<EventTag, EventEntry> eventsInFlight_;
  std::mutex eventsInFlightMutex_;

  static EventTag sCurrentEventTag_;
};

} // namespace facebook::react
