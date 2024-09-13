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

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule>
NativePerformanceObserverModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativePerformanceObserver>(
      std::move(jsInvoker));
}

namespace facebook::react {

std::optional<PerformanceEntryType> parseEntryType(int rawValue) {
  if (rawValue < 0 || rawValue >= NUM_PERFORMANCE_ENTRY_TYPES) {
    return std::nullopt;
  }

  return static_cast<PerformanceEntryType>(rawValue);
}

NativePerformanceObserver::NativePerformanceObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativePerformanceObserverCxxSpec(std::move(jsInvoker)) {}

jsi::Object NativePerformanceObserver::createObserver(jsi::Runtime& rt, NativePerformanceObserverCallback callback) {
  // The way we dispatch performance observer callbacks is a bit different from
  // the spec. The specification requires us to queue a single task that dispatches
  // observer callbacks. Instead, we are queuing all callbacks as separate tasks
  // in the scheduler.
  PerformanceObserverCallback cb = [callback = std::move(callback)](std::vector<PerformanceEntry>&& entries, size_t droppedEntriesCount) -> void {
    callback.callWithPriority(SchedulerPriority::IdlePriority, std::move(entries), droppedEntriesCount);
  };

  auto observer = std::make_shared<PerformanceObserver>(std::move(cb));
  jsi::Object observerObj {rt};
  observerObj.setNativeState(rt, observer);
  return observerObj;
}

void NativePerformanceObserver::observe(jsi::Runtime& rt, jsi::Object observerObj, NativePerformanceObserverObserveOptions options) {
  auto observer =
      std::dynamic_pointer_cast<PerformanceObserver>(observerObj.getNativeState(rt));

  if (!observer) {
    return;
  }

  // observer of type multiple
  if (options.entryTypes.has_value()) {
    std::unordered_set<PerformanceEntryType> entryTypes;
    auto rawTypes = options.entryTypes.value();

    for (auto i = 0; i < rawTypes.size(); ++i) {
      if (auto entryType = parseEntryType(rawTypes[i]); entryType) {
        entryTypes.insert(*entryType);
      }
    }

    observer->observe(entryTypes);
  }
  else { // single
    auto buffered = options.buffered.value_or(false);
    if (auto entryType = parseEntryType(options.type.value()); entryType) {
      observer->observe(entryType, buffered);
    }
  }

  auto& registry = PerformanceEntryReporter::getInstance()->getObserverRegistry();
  registry.addObserver(observer);
}

void NativePerformanceObserver::disconnect(jsi::Runtime& rt, jsi::Object observerObj) {
  auto observer =
      std::dynamic_pointer_cast<PerformanceObserver>(observerObj.getNativeState(rt));

  if (!observer) {
    return;
  }
  observerObj.setNativeState(rt, nullptr);

  auto& registry = PerformanceEntryReporter::getInstance()->getObserverRegistry();
  registry.removeObserver(observer);
}

std::vector<PerformanceEntry> NativePerformanceObserver::takeRecords(jsi::Runtime& rt, jsi::Object observerObj) {
  auto observer =
      std::dynamic_pointer_cast<PerformanceObserver>(
      observerObj.getNativeState(rt));

  if (!observer) {
    return {};
  }

  return observer->takeRecords();
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

std::vector<std::pair<std::string, uint32_t>>
NativePerformanceObserver::getEventCounts(jsi::Runtime& /*rt*/) {
  const auto& eventCounts =
      PerformanceEntryReporter::getInstance()->getEventCounts();
  return { eventCounts.begin(), eventCounts.end() };
}
} // namespace facebook::react
