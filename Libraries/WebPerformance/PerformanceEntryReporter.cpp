/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerformanceEntryReporter.h"
#include <glog/logging.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include "NativePerformanceObserver.h"

// All the unflushed entries beyond this amount will get discarded, with
// the amount of discarded ones sent back to the observers' callbacks as
// "droppedEntryCount" value
static constexpr size_t MAX_ENTRY_BUFFER_SIZE = 1024;

namespace facebook::react {
PerformanceEntryReporter &PerformanceEntryReporter::getInstance() {
  static PerformanceEntryReporter instance;
  return instance;
}

void PerformanceEntryReporter::setReportingCallback(
    std::optional<AsyncCallback<>> callback) {
  callback_ = callback;
}

void PerformanceEntryReporter::startReporting(PerformanceEntryType entryType) {
  reportingType_[static_cast<int>(entryType)] = true;
}
void PerformanceEntryReporter::stopReporting(PerformanceEntryType entryType) {
  reportingType_[static_cast<int>(entryType)] = false;
}

const std::vector<RawPerformanceEntry>
    &PerformanceEntryReporter::getPendingEntries() const {
  return entries_;
}

GetPendingEntriesResult PerformanceEntryReporter::popPendingEntries() {
  GetPendingEntriesResult res = {std::move(entries_), droppedEntryCount_};
  entries_ = {};
  droppedEntryCount_ = 0;
  return res;
}

void PerformanceEntryReporter::clearPendingEntries() {
  entries_.clear();
}

void PerformanceEntryReporter::logEntry(const RawPerformanceEntry &entry) {
  if (!isReportingType(static_cast<PerformanceEntryType>(entry.entryType))) {
    return;
  }

  if (entries_.size() == MAX_ENTRY_BUFFER_SIZE) {
    // Start dropping entries once reached maximum buffer size.
    // The number of dropped entries will be reported back to the corresponding
    // PerformanceObserver callback.
    droppedEntryCount_ += 1;
    return;
  }

  entries_.emplace_back(entry);

  if (entries_.size() == 1) {
    // If the buffer was empty, it signals that JS side just has possibly
    // consumed it and is ready to get more
    scheduleFlushBuffer();
  }
}

void PerformanceEntryReporter::mark(
    const std::string &name,
    double startTime,
    double duration) {
  // Register the mark for further possible "measure" lookup, as well as add
  // it to a circular buffer:
  PerformanceMark &mark = marksBuffer_[marksBufferPosition_];
  marksBufferPosition_ = (marksBufferPosition_ + 1) % marksBuffer_.size();

  if (!mark.name.empty()) {
    // Drop off the oldest mark out of the queue, but only if that's indeed the
    // oldest one
    auto it = marksRegistry_.find(&mark);
    if (it != marksRegistry_.end() && *it == &mark) {
      marksRegistry_.erase(it);
    }
  }

  mark.name = name;
  mark.timeStamp = startTime;
  marksRegistry_.insert(&mark);

  logEntry(
      {name,
       static_cast<int>(PerformanceEntryType::MARK),
       startTime,
       duration,
       std::nullopt,
       std::nullopt,
       std::nullopt});
}

void PerformanceEntryReporter::clearMarks(
    const std::optional<std::string> &markName) {
  if (markName) {
    PerformanceMark mark{{*markName, 0}};
    marksRegistry_.erase(&mark);
    clearEntries([&markName](const RawPerformanceEntry &entry) {
      return entry.entryType == static_cast<int>(PerformanceEntryType::MARK) &&
          entry.name == markName;
    });
  } else {
    marksRegistry_.clear();
    clearEntries([](const RawPerformanceEntry &entry) {
      return entry.entryType == static_cast<int>(PerformanceEntryType::MARK);
    });
  }
}

void PerformanceEntryReporter::measure(
    const std::string &name,
    double startTime,
    double endTime,
    const std::optional<double> &duration,
    const std::optional<std::string> &startMark,
    const std::optional<std::string> &endMark) {
  double startTimeVal = startMark ? getMarkTime(*startMark) : startTime;
  double endTimeVal = endMark ? getMarkTime(*endMark) : endTime;
  double durationVal = duration ? *duration : endTimeVal - startTimeVal;
  logEntry(
      {name,
       static_cast<int>(PerformanceEntryType::MEASURE),
       startTimeVal,
       durationVal,
       std::nullopt,
       std::nullopt,
       std::nullopt});
}

void PerformanceEntryReporter::clearMeasures(
    const std::optional<std::string> &measureName) {
  if (measureName) {
    clearEntries([&measureName](const RawPerformanceEntry &entry) {
      return entry.entryType ==
          static_cast<int>(PerformanceEntryType::MEASURE) &&
          entry.name == measureName;
    });
  } else {
    marksRegistry_.clear();
    clearEntries([](const RawPerformanceEntry &entry) {
      return entry.entryType == static_cast<int>(PerformanceEntryType::MEASURE);
    });
  }
}

double PerformanceEntryReporter::getMarkTime(
    const std::string &markName) const {
  PerformanceMark mark{{std::move(markName), 0}};
  auto it = marksRegistry_.find(&mark);
  if (it != marksRegistry_.end()) {
    return (*it)->timeStamp;
  } else {
    return 0.0;
  }
}

void PerformanceEntryReporter::event(
    const std::string &name,
    double startTime,
    double duration,
    bool isFirstInput,
    double processingStart,
    double processingEnd,
    uint32_t interactionId) {
  logEntry(
      {name,
       static_cast<int>(
           isFirstInput ? PerformanceEntryType::FIRST_INPUT
                        : PerformanceEntryType::MEASURE),
       startTime,
       duration,
       processingStart,
       processingEnd,
       interactionId});
}

void PerformanceEntryReporter::clearEntries(
    std::function<bool(const RawPerformanceEntry &)> predicate) {
  int lastPos = entries_.size() - 1;
  int pos = lastPos;
  while (pos >= 0) {
    if (predicate(entries_[pos])) {
      entries_[pos] = entries_[lastPos];
      lastPos--;
    }
    pos--;
  }
  entries_.resize(lastPos + 1);
}

void PerformanceEntryReporter::scheduleFlushBuffer() {
  if (callback_) {
    callback_->callWithPriority(SchedulerPriority::IdlePriority);
  }
}

} // namespace facebook::react
