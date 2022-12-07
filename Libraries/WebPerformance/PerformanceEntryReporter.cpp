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

std::vector<RawPerformanceEntry> PerformanceEntryReporter::popPendingEntries() {
  auto entriesToReturn = std::move(entries_);
  entries_ = {};
  return entriesToReturn;
}

void PerformanceEntryReporter::clearPendingEntries() {
  entries_.clear();
}

void PerformanceEntryReporter::logEntry(const RawPerformanceEntry &entry) {
  if (!isReportingType(static_cast<PerformanceEntryType>(entry.entryType))) {
    return;
  }

  entries_.emplace_back(entry);

  // TODO: Add buffering/throttling - but for testing this works as well, for
  // now
  callback_->callWithPriority(SchedulerPriority::IdlePriority);
}

void PerformanceEntryReporter::mark(
    const std::string &name,
    double startTime,
    double duration) {
  // Register the mark for further possible "measure" lookup, as well as add
  // it to a circular buffer:
  PerformanceMark &mark = marks_buffer_[marks_buffer_position_];
  marks_buffer_position_ = (marks_buffer_position_ + 1) % marks_buffer_.size();

  if (!mark.name.empty()) {
    // Drop off the oldest mark out of the queue, but only if that's indeed the
    // oldest one
    auto it = marks_registry_.find(&mark);
    if (it != marks_registry_.end() && *it == &mark) {
      marks_registry_.erase(it);
    }
  }

  mark.name = name;
  mark.timeStamp = startTime;
  marks_registry_.insert(&mark);

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
    marks_registry_.erase(&mark);
    clearEntries([&markName](const RawPerformanceEntry &entry) {
      return entry.entryType == static_cast<int>(PerformanceEntryType::MARK) &&
          entry.name == markName;
    });
  } else {
    marks_registry_.clear();
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
    marks_registry_.clear();
    clearEntries([](const RawPerformanceEntry &entry) {
      return entry.entryType == static_cast<int>(PerformanceEntryType::MEASURE);
    });
  }
}

double PerformanceEntryReporter::getMarkTime(
    const std::string &markName) const {
  PerformanceMark mark{{std::move(markName), 0}};
  auto it = marks_registry_.find(&mark);
  if (it != marks_registry_.end()) {
    return (*it)->timeStamp;
  } else {
    return 0.0;
  }
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

} // namespace facebook::react
