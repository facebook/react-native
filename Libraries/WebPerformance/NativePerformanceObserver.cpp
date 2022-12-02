/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativePerformanceObserver.h"
#include <glog/logging.h>
#include "PerformanceEntryReporter.h"

namespace facebook::react {

static PerformanceEntryType stringToPerformanceEntryType(
    const std::string &entryType) {
  if (entryType == "mark") {
    return PerformanceEntryType::MARK;
  } else {
    return PerformanceEntryType::UNDEFINED;
  }
}

NativePerformanceObserver::NativePerformanceObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativePerformanceObserverCxxSpec(std::move(jsInvoker)),
      reporter_(std::make_unique<PerformanceEntryReporter>()) {}

NativePerformanceObserver::~NativePerformanceObserver() {}

void NativePerformanceObserver::startReporting(
    jsi::Runtime &rt,
    std::string entryType) {
  reporter_->startReporting(stringToPerformanceEntryType(entryType));
}

void NativePerformanceObserver::stopReporting(
    jsi::Runtime &rt,
    std::string entryType) {
  reporter_->stopReporting(stringToPerformanceEntryType(entryType));
}

std::vector<RawPerformanceEntry> NativePerformanceObserver::getPendingEntries(
    jsi::Runtime &rt) {
  return reporter_->popPendingEntries();
}

void NativePerformanceObserver::setOnPerformanceEntryCallback(
    jsi::Runtime &rt,
    std::optional<AsyncCallback<>> callback) {
  reporter_->setReportingCallback(callback);
}

void NativePerformanceObserver::logEntryForDebug(
    jsi::Runtime &rt,
    RawPerformanceEntry entry) {
  reporter_->logEntry(entry);
}

} // namespace facebook::react
