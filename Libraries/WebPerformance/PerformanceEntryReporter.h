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

  RawPerformanceEntry toRawPerformanceEntry() const;
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

struct PerformanceMeasure {
  std::string name;
  double timeStamp;
  double duration;

  RawPerformanceEntry toRawPerformanceEntry() const;
};

using PerformanceMarkRegistryType = std::
    unordered_set<PerformanceMark *, PerformanceMarkHash, PerformanceMarkEqual>;

// Only the MARKS_BUFFER_SIZE amount of the latest marks will be kept in
// memory for the sake of the "Performance.measure" mark name lookup
constexpr size_t MARKS_BUFFER_SIZE = 1024;

// Limit buffer size for the measures kept in memory (only keep the latest ones)
constexpr size_t MEASURES_BUFFER_SIZE = 1024;

constexpr double DEFAULT_DURATION_THRESHOLD = 0.0;

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
  void stopReporting();
  void setDurationThreshold(
      PerformanceEntryType entryType,
      double durationThreshold);

  GetPendingEntriesResult popPendingEntries();
  void logEntry(const RawPerformanceEntry &entry);

  bool isReporting(PerformanceEntryType entryType) const {
    return reportingType_[static_cast<int>(entryType)];
  }

  bool isReportingEvents() const {
    return isReporting(PerformanceEntryType::EVENT);
  }

  uint32_t getDroppedEntryCount() const {
    return droppedEntryCount_;
  }

  void mark(const std::string &name, double startTime, double duration);

  void measure(
      const std::string &name,
      double startTime,
      double endTime,
      const std::optional<double> &duration = std::nullopt,
      const std::optional<std::string> &startMark = std::nullopt,
      const std::optional<std::string> &endMark = std::nullopt);

  void clearEntries(
      PerformanceEntryType entryType = PerformanceEntryType::UNDEFINED,
      const char *entryName = nullptr);

  std::vector<RawPerformanceEntry> getEntries(
      PerformanceEntryType entryType = PerformanceEntryType::UNDEFINED,
      const char *entryName = nullptr) const;

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

  const std::unordered_map<std::string, uint32_t> &getEventCounts() const {
    return eventCounts_;
  }

 private:
  std::optional<AsyncCallback<>> callback_;
  std::vector<RawPerformanceEntry> entries_;
  std::mutex entriesMutex_;
  std::array<bool, (size_t)PerformanceEntryType::_COUNT> reportingType_{false};
  std::unordered_map<std::string, uint32_t> eventCounts_;
  std::array<double, (size_t)PerformanceEntryType::_COUNT> durationThreshold_{
      DEFAULT_DURATION_THRESHOLD};

  // Mark registry for "measure" lookup
  PerformanceMarkRegistryType marksRegistry_;
  std::array<PerformanceMark, MARKS_BUFFER_SIZE> marksBuffer_;
  size_t marksBufferPosition_{0};
  size_t marksCount_{0};

  std::array<PerformanceMeasure, MEASURES_BUFFER_SIZE> measuresBuffer_;
  size_t measuresBufferPosition_{0};
  size_t measuresCount_{0};

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

  PerformanceEntryReporter() {}

  double getMarkTime(const std::string &markName) const;
  void scheduleFlushBuffer();

  template <class T, size_t N>
  std::vector<RawPerformanceEntry> getCircularBufferContents(
      const std::array<T, N> &buffer,
      size_t entryCount,
      size_t bufferPosition,
      const char *entryName = nullptr) const {
    std::vector<RawPerformanceEntry> res;
    size_t pos = (bufferPosition - entryCount + buffer.size()) % buffer.size();
    for (size_t i = 0; i < entryCount; i++) {
      if (entryName == nullptr || buffer[pos].name == entryName) {
        res.push_back(buffer[pos].toRawPerformanceEntry());
      }
      pos = (pos + 1) % buffer.size();
    }
    return res;
  }

  template <class T, size_t N>
  void clearCircularBuffer(
      std::array<T, N> &buffer,
      size_t &entryCount,
      size_t &bufferPosition,
      const char *entryName) const {
    std::array<T, N> newBuffer;
    size_t newEntryCount = 0;

    size_t pos = (bufferPosition - entryCount + buffer.size()) % buffer.size();
    for (size_t i = 0; i < entryCount; i++) {
      if (buffer[pos].name != entryName) {
        newBuffer[newEntryCount++] = buffer[pos];
      }
      pos = (pos + 1) % buffer.size();
    }

    buffer = newBuffer;
    bufferPosition = newEntryCount;
    entryCount = newEntryCount;
  }
};

} // namespace facebook::react
