/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include "NativePerformanceObserver.h"
#include "PerformanceEntryReporter.h"

#include "Plugins.h"

std::shared_ptr<facebook::react::TurboModule>
NativePerformanceObserverModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativePerformanceObserver>(
      std::move(jsInvoker));
}

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

void NativePerformanceObserver::logRawEntry(
    jsi::Runtime &rt,
    RawPerformanceEntry entry) {
  PerformanceEntryReporter::getInstance().logEntry(entry);
}

std::vector<std::pair<std::string, uint32_t>>
NativePerformanceObserver::getEventCounts(jsi::Runtime &rt) {
  const auto &eventCounts =
      PerformanceEntryReporter::getInstance().getEventCounts();
  return std::vector<std::pair<std::string, uint32_t>>(
      eventCounts.begin(), eventCounts.end());
}

void NativePerformanceObserver::setDurationThreshold(
    jsi::Runtime &rt,
    int32_t entryType,
    double durationThreshold) {
  PerformanceEntryReporter::getInstance().setDurationThreshold(
      static_cast<PerformanceEntryType>(entryType), durationThreshold);
}

} // namespace facebook::react
