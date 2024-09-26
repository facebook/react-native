/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativePerformanceObserver.h"
#include <jsi/jsi.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <react/performance/timeline/PerformanceObserver.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/utils/CoreFeatures.h>
#include <memory>

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

class PerformanceObserverWrapper : public jsi::NativeState {
 public:
  explicit PerformanceObserverWrapper(
      const std::shared_ptr<PerformanceObserver> observer)
      : observer(observer) {}

  std::shared_ptr<PerformanceObserver> observer;
};

NativePerformanceObserver::NativePerformanceObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativePerformanceObserverCxxSpec(std::move(jsInvoker)) {}

jsi::Object NativePerformanceObserver::createObserver(
    jsi::Runtime& rt,
    NativePerformanceObserverCallback callback) {
  // The way we dispatch performance observer callbacks is a bit different from
  // the spec. The specification requires us to queue a single task that
  // dispatches observer callbacks. Instead, we are queuing all callbacks as
  // separate tasks in the scheduler.
  PerformanceObserverCallback cb = [callback = std::move(callback)]() {
    callback.callWithPriority(SchedulerPriority::IdlePriority);
  };

  auto& registry =
      PerformanceEntryReporter::getInstance()->getObserverRegistry();

  auto observer = PerformanceObserver::create(registry, std::move(cb));
  auto observerWrapper = std::make_shared<PerformanceObserverWrapper>(observer);
  jsi::Object observerObj{rt};
  observerObj.setNativeState(rt, observerWrapper);
  return observerObj;
}

double NativePerformanceObserver::getDroppedEntriesCount(
    jsi::Runtime& rt,
    jsi::Object observerObj) {
  auto observerWrapper = std::dynamic_pointer_cast<PerformanceObserverWrapper>(
      observerObj.getNativeState(rt));

  if (!observerWrapper) {
    return 0;
  }

  auto observer = observerWrapper->observer;
  return observer->getDroppedEntriesCount();
}

void NativePerformanceObserver::observe(
    jsi::Runtime& rt,
    jsi::Object observerObj,
    NativePerformanceObserverObserveOptions options) {
  auto observerWrapper = std::dynamic_pointer_cast<PerformanceObserverWrapper>(
      observerObj.getNativeState(rt));

  if (!observerWrapper) {
    return;
  }

  auto observer = observerWrapper->observer;
  auto durationThreshold = options.durationThreshold.value_or(0.0);

  // observer of type multiple
  if (options.entryTypes.has_value()) {
    std::unordered_set<PerformanceEntryType> entryTypes;
    auto rawTypes = options.entryTypes.value();

    for (auto rawType : rawTypes) {
      entryTypes.insert(Bridging<PerformanceEntryType>::fromJs(rt, rawType));
    }

    observer->observe(entryTypes);
  } else { // single
    auto buffered = options.buffered.value_or(false);
    if (options.type.has_value()) {
      observer->observe(
          static_cast<PerformanceEntryType>(options.type.value()),
          {.buffered = buffered, .durationThreshold = durationThreshold});
    }
  }
}

void NativePerformanceObserver::disconnect(
    jsi::Runtime& rt,
    jsi::Object observerObj) {
  auto observerWrapper = std::dynamic_pointer_cast<PerformanceObserverWrapper>(
      observerObj.getNativeState(rt));

  if (!observerWrapper) {
    return;
  }

  auto observer = observerWrapper->observer;
  observer->disconnect();
}

std::vector<PerformanceEntry> NativePerformanceObserver::takeRecords(
    jsi::Runtime& rt,
    jsi::Object observerObj,
    bool sort) {
  auto observerWrapper = std::dynamic_pointer_cast<PerformanceObserverWrapper>(
      observerObj.getNativeState(rt));

  if (!observerWrapper) {
    return {};
  }

  auto observer = observerWrapper->observer;
  auto records = observer->takeRecords();
  if (sort) {
    std::stable_sort(records.begin(), records.end(), PerformanceEntrySorter{});
  }
  return records;
}

void NativePerformanceObserver::clearEntries(
    jsi::Runtime& /*rt*/,
    PerformanceEntryType entryType,
    std::optional<std::string> entryName) {
  PerformanceEntryReporter::getInstance()->clearEntries(entryType, entryName);
}

std::vector<PerformanceEntry> NativePerformanceObserver::getEntries(
    jsi::Runtime& /*rt*/,
    std::optional<PerformanceEntryType> entryType,
    std::optional<std::string> entryName) {
  const auto reporter = PerformanceEntryReporter::getInstance();

  std::vector<PerformanceEntry> entries;

  if (entryType.has_value()) {
    if (entryName.has_value()) {
      entries =
          reporter->getEntriesByName(entryName.value(), entryType.value());
    } else {
      entries = reporter->getEntriesByType(entryType.value());
    }
  } else if (entryName.has_value()) {
    entries = reporter->getEntriesByName(entryName.value());
  } else {
    entries = reporter->getEntries();
  }

  std::stable_sort(entries.begin(), entries.end(), PerformanceEntrySorter{});

  return entries;
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
  return {eventCounts.begin(), eventCounts.end()};
}
} // namespace facebook::react
