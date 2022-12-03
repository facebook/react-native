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
  logEntry(
      {name,
       static_cast<int>(PerformanceEntryType::MARK),
       startTime,
       duration,
       std::nullopt,
       std::nullopt,
       std::nullopt});
}
} // namespace facebook::react
