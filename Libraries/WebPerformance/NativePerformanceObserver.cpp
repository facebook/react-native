/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativePerformanceObserver.h"
#include "PerformanceEntryReporter.h"

namespace facebook::react {

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
    int32_t entryType) {
  PerformanceEntryReporter::getInstance().startReporting(
      static_cast<PerformanceEntryType>(entryType));
}

void NativePerformanceObserver::stopReporting(
    jsi::Runtime &rt,
    int32_t entryType) {
  PerformanceEntryReporter::getInstance().stopReporting(
      static_cast<PerformanceEntryType>(entryType));
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
