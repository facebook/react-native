/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Function.h>
#include <array>
#include <functional>
#include <optional>
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
  FIRST_INPUT = 4,
  _COUNT = 5,
};

class PerformanceEntryReporter {
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

  const std::vector<RawPerformanceEntry> &getPendingEntries() const;
  GetPendingEntriesResult popPendingEntries();
  void clearPendingEntries();
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
      const std::string &name,
      double startTime,
      double duration,
      bool isFirstInput,
      double processingStart,
      double processingEnd,
      uint32_t interactionId);

 private:
  PerformanceEntryReporter() {}

  double getMarkTime(const std::string &markName) const;
  void clearEntries(std::function<bool(const RawPerformanceEntry &)> predicate);
  void scheduleFlushBuffer();

  std::optional<AsyncCallback<>> callback_;
  std::vector<RawPerformanceEntry> entries_;
  std::array<bool, (size_t)PerformanceEntryType::_COUNT> reportingType_{false};

  // Mark registry for "measure" lookup
  PerformanceMarkRegistryType marksRegistry_;
  std::array<PerformanceMark, MARKS_BUFFER_SIZE> marksBuffer_;
  size_t marksBufferPosition_{0};
  uint32_t droppedEntryCount_{0};
};

} // namespace facebook::react
