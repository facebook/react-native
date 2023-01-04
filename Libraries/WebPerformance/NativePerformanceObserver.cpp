/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativePerformanceObserver.h"
#include "PerformanceEntryReporter.h"

namespace facebook::react {

static PerformanceEntryType stringToPerformanceEntryType(
    const std::string &entryType) {
  if (entryType == "mark") {
    return PerformanceEntryType::MARK;
  } else if (entryType == "measure") {
    return PerformanceEntryType::MEASURE;
  } else if (entryType == "event") {
    return PerformanceEntryType::EVENT;
  } else {
    return PerformanceEntryType::UNDEFINED;
  }
}

NativePerformanceObserver::NativePerformanceObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativePerformanceObserverCxxSpec(std::move(jsInvoker)) {
  setEventLogger(&PerformanceEntryReporter::getInstance());
}

NativePerformanceObserver::~NativePerformanceObserver() {
  setEventLogger(nullptr);
}

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

GetPendingEntriesResult NativePerformanceObserver::popPendingEntries(
    jsi::Runtime &rt) {
  return PerformanceEntryReporter::getInstance().popPendingEntries();
}

void NativePerformanceObserver::setOnPerformanceEntryCallback(
    jsi::Runtime &rt,
    std::optional<AsyncCallback<>> callback) {
  PerformanceEntryReporter::getInstance().setReportingCallback(callback);
}

} // namespace facebook::react
