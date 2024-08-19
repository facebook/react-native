/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include "NativePerformanceObserver.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/utils/CoreFeatures.h>

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
    : NativePerformanceObserverCxxSpec(std::move(jsInvoker)) {}

void NativePerformanceObserver::startReporting(
    jsi::Runtime& /*rt*/,
    PerformanceEntryType entryType) {
  auto reporter = PerformanceEntryReporter::getInstance();

  reporter->startReporting(entryType);
}

void NativePerformanceObserver::stopReporting(
    jsi::Runtime& /*rt*/,
    PerformanceEntryType entryType) {
  auto reporter = PerformanceEntryReporter::getInstance();

  reporter->stopReporting(entryType);
}

void NativePerformanceObserver::setIsBuffered(
    jsi::Runtime& /*rt*/,
    const std::vector<PerformanceEntryType> entryTypes,
    bool isBuffered) {
  for (const PerformanceEntryType entryType : entryTypes) {
    PerformanceEntryReporter::getInstance()->setAlwaysLogged(
        entryType, isBuffered);
  }
}

PerformanceEntryReporter::PopPendingEntriesResult
NativePerformanceObserver::popPendingEntries(jsi::Runtime& /*rt*/) {
  return PerformanceEntryReporter::getInstance()->popPendingEntries();
}

void NativePerformanceObserver::setOnPerformanceEntryCallback(
    jsi::Runtime& /*rt*/,
    std::optional<AsyncCallback<>> callback) {
  if (callback) {
    PerformanceEntryReporter::getInstance()->setReportingCallback(
        [callback = std::move(callback)]() {
          callback->callWithPriority(SchedulerPriority::IdlePriority);
        });
  } else {
    PerformanceEntryReporter::getInstance()->setReportingCallback(nullptr);
  }
}

void NativePerformanceObserver::logRawEntry(
    jsi::Runtime& /*rt*/,
    const PerformanceEntry entry) {
  PerformanceEntryReporter::getInstance()->logEntry(entry);
}

std::vector<std::pair<std::string, uint32_t>>
NativePerformanceObserver::getEventCounts(jsi::Runtime& /*rt*/) {
  const auto& eventCounts =
      PerformanceEntryReporter::getInstance()->getEventCounts();
  return std::vector<std::pair<std::string, uint32_t>>(
      eventCounts.begin(), eventCounts.end());
}

void NativePerformanceObserver::setDurationThreshold(
    jsi::Runtime& /*rt*/,
    PerformanceEntryType entryType,
    double durationThreshold) {
  PerformanceEntryReporter::getInstance()->setDurationThreshold(
      entryType, durationThreshold);
}

void NativePerformanceObserver::clearEntries(
    jsi::Runtime& /*rt*/,
    PerformanceEntryType entryType,
    std::optional<std::string> entryName) {
  PerformanceEntryReporter::getInstance()->clearEntries(
      entryType, entryName ? entryName->c_str() : std::string_view{});
}

std::vector<PerformanceEntry> NativePerformanceObserver::getEntries(
    jsi::Runtime& /*rt*/,
    std::optional<PerformanceEntryType> entryType,
    std::optional<std::string> entryName) {
  return PerformanceEntryReporter::getInstance()->getEntries(
      entryType, entryName ? entryName->c_str() : std::string_view{});
}

std::vector<PerformanceEntryType>
NativePerformanceObserver::getSupportedPerformanceEntryTypes(
    jsi::Runtime& /*rt*/) {
  std::vector supportedEntries = {
      PerformanceEntryType::MARK,
      PerformanceEntryType::MEASURE,
      PerformanceEntryType::EVENT,
  };

  if (ReactNativeFeatureFlags::enableLongTaskAPI()) {
    supportedEntries.push_back(PerformanceEntryType::LONGTASK);
  }

  return supportedEntries;
}

} // namespace facebook::react
