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
  } else if (entryType == "measure") {
    return PerformanceEntryType::MEASURE;
  } else {
    return PerformanceEntryType::UNDEFINED;
  }
}

NativePerformanceObserver::NativePerformanceObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativePerformanceObserverCxxSpec(std::move(jsInvoker)) {}

void NativePerformanceObserver::startReporting(
    jsi::Runtime &rt,
    std::string entryType) {
  PerformanceEntryReporter::getInstance().startReporting(
      stringToPerformanceEntryType(entryType));
}

void NativePerformanceObserver::stopReporting(
    jsi::Runtime &rt,
    std::string entryType) {
  PerformanceEntryReporter::getInstance().stopReporting(
      stringToPerformanceEntryType(entryType));
}

std::vector<RawPerformanceEntry> NativePerformanceObserver::popPendingEntries(
    jsi::Runtime &rt) {
  return PerformanceEntryReporter::getInstance().popPendingEntries();
}

std::vector<RawPerformanceEntry> NativePerformanceObserver::getPendingEntries(
    jsi::Runtime &rt) {
  return PerformanceEntryReporter::getInstance().getPendingEntries();
}

void NativePerformanceObserver::setOnPerformanceEntryCallback(
    jsi::Runtime &rt,
    std::optional<AsyncCallback<>> callback) {
  PerformanceEntryReporter::getInstance().setReportingCallback(callback);
}

} // namespace facebook::react
