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

jsi::Object NativePerformanceObserver::createObserver(jsi::Runtime& rt, AsyncCallback<> callback) {
  PerformanceObserverCallback cb = [callback = std::move(callback)](size_t _) -> void {
    callback.callWithPriority(SchedulerPriority::IdlePriority);
  };

  auto observer = std::make_shared<PerformanceObserver>(std::move(cb));
  jsi::Object observerObj {rt};
  observerObj.setNativeState(rt, std::move(observer));
  return observerObj;
}

void NativePerformanceObserver::observe(jsi::Runtime& rt, jsi::Object observerObj, jsi::Object options) {
  auto observer =
      std::dynamic_pointer_cast<PerformanceObserver>(observerObj.getNativeState(rt));

  if (!observer) {
    return;
  }

  std::set<int> entryTypes;

  // observer of type multiple
  if (options.hasProperty(rt, "entryTypes")) {
    auto types = options.getPropertyAsObject(rt, "entryTypes").asArray(rt);
    for (auto i = 0; i < types.size(rt); ++i) {
      entryTypes.insert(types.getValueAtIndex(rt, i).asNumber());
    }
  }
  else {
    auto buffered = options.getProperty(rt, "buffered").asBool();
    auto type = options.getProperty(rt, "type").asNumber();
    entryTypes.insert(type);
    observer->setEntryBuffering(buffered);
  }

  // apply collected entryTypes into observer eventFilter
  for (auto entryType : entryTypes) {
    if (entryType < 0 || entryType >= NUM_PERFORMANCE_ENTRY_TYPES) {
      continue;
    }

    observer->getEventFilter().insert(static_cast<PerformanceEntryType>(entryType));
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

  return observer->popPendingEntries().entries;
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
