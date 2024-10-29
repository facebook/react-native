/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativePerformance.h"

#include <memory>
#include <mutex>
#include <unordered_map>

#include <cxxreact/JSExecutor.h>
#include <cxxreact/ReactMarker.h>
#include <jsi/instrumentation.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <react/performance/timeline/PerformanceObserver.h>
#include <reactperflogger/ReactPerfLogger.h>

#include "NativePerformance.h"

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

#ifdef WITH_PERFETTO
#include <reactperflogger/ReactPerfetto.h>
#endif

std::shared_ptr<facebook::react::TurboModule> NativePerformanceModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativePerformance>(
      std::move(jsInvoker));
}

namespace facebook::react {

namespace {

#if defined(__clang__)
#define NO_DESTROY [[clang::no_destroy]]
#else
#define NO_DESTROY
#endif

NO_DESTROY const std::string TRACK_PREFIX = "Track:";
NO_DESTROY const std::string DEFAULT_TRACK_NAME = "# Web Performance";
NO_DESTROY const std::string CUSTOM_TRACK_NAME_PREFIX = "# Web Performance: ";

std::tuple<std::string, std::string_view> parseTrackName(
    const std::string& name) {
  // Until there's a standard way to pass through track information, parse it
  // manually, e.g., "Track:Foo:Event name"
  // https://github.com/w3c/user-timing/issues/109
  std::optional<std::string> trackName;
  std::string_view eventName(name);
  if (name.starts_with(TRACK_PREFIX)) {
    const auto trackNameDelimiter = name.find(':', TRACK_PREFIX.length());
    if (trackNameDelimiter != std::string::npos) {
      trackName = CUSTOM_TRACK_NAME_PREFIX +
          name.substr(
              TRACK_PREFIX.length(),
              trackNameDelimiter - TRACK_PREFIX.length());
      eventName = std::string_view(name).substr(trackNameDelimiter + 1);
    }
  }

  auto& trackNameRef = trackName.has_value() ? *trackName : DEFAULT_TRACK_NAME;
  return std::make_tuple(trackNameRef, eventName);
}

class PerformanceObserverWrapper : public jsi::NativeState {
 public:
  explicit PerformanceObserverWrapper(
      const std::shared_ptr<PerformanceObserver> observer)
      : observer(observer) {}

  const std::shared_ptr<PerformanceObserver> observer;
};

void sortEntries(std::vector<PerformanceEntry>& entries) {
  return std::stable_sort(
      entries.begin(), entries.end(), PerformanceEntrySorter{});
}

const std::array<PerformanceEntryType, 2> ENTRY_TYPES_AVAILABLE_FROM_TIMELINE{
    {PerformanceEntryType::MARK, PerformanceEntryType::MEASURE}};

bool isAvailableFromTimeline(PerformanceEntryType entryType) {
  return entryType == PerformanceEntryType::MARK ||
      entryType == PerformanceEntryType::MEASURE;
}

std::shared_ptr<PerformanceObserver> tryGetObserver(
    jsi::Runtime& rt,
    jsi::Object& observerObj) {
  if (!observerObj.hasNativeState(rt)) {
    return nullptr;
  }

  auto observerWrapper = std::dynamic_pointer_cast<PerformanceObserverWrapper>(
      observerObj.getNativeState(rt));
  return observerWrapper ? observerWrapper->observer : nullptr;
}

} // namespace

NativePerformance::NativePerformance(std::shared_ptr<CallInvoker> jsInvoker)
    : NativePerformanceCxxSpec(std::move(jsInvoker)) {
#ifdef WITH_PERFETTO
  initializePerfetto();
#endif
}

double NativePerformance::now(jsi::Runtime& /*rt*/) {
  return JSExecutor::performanceNow();
}

double NativePerformance::markWithResult(
    jsi::Runtime& rt,
    std::string name,
    std::optional<double> startTime) {
  auto [trackName, eventName] = parseTrackName(name);
  auto entry =
      PerformanceEntryReporter::getInstance()->reportMark(name, startTime);

  ReactPerfLogger::mark(eventName, entry.startTime, trackName);

  return entry.startTime;
}

std::tuple<double, double> NativePerformance::measureWithResult(
    jsi::Runtime& rt,
    std::string name,
    double startTime,
    double endTime,
    std::optional<double> duration,
    std::optional<std::string> startMark,
    std::optional<std::string> endMark) {
  auto [trackName, eventName] = parseTrackName(name);

  auto entry = PerformanceEntryReporter::getInstance()->reportMeasure(
      eventName, startTime, endTime, duration, startMark, endMark);

  ReactPerfLogger::measure(
      eventName, entry.startTime, entry.startTime + entry.duration, trackName);

  return std::tuple{entry.startTime, entry.duration};
}

void NativePerformance::mark(
    jsi::Runtime& rt,
    std::string name,
    double startTime) {
  auto [trackName, eventName] = parseTrackName(name);
  ReactPerfLogger::mark(eventName, startTime, trackName);

  PerformanceEntryReporter::getInstance()->reportMark(name, startTime);
}

void NativePerformance::measure(
    jsi::Runtime& rt,
    std::string name,
    double startTime,
    double endTime,
    std::optional<double> duration,
    std::optional<std::string> startMark,
    std::optional<std::string> endMark) {
  auto [trackName, eventName] = parseTrackName(name);

  // TODO T190600850 support startMark/endMark
  if (!startMark && !endMark) {
    ReactPerfLogger::measure(eventName, startTime, endTime, trackName);
  }

  PerformanceEntryReporter::getInstance()->reportMeasure(
      eventName, startTime, endTime, duration, startMark, endMark);
}

void NativePerformance::clearMarks(
    jsi::Runtime& /*rt*/,
    std::optional<std::string> entryName) {
  if (entryName) {
    PerformanceEntryReporter::getInstance()->clearEntries(
        PerformanceEntryType::MARK, *entryName);
  } else {
    PerformanceEntryReporter::getInstance()->clearEntries(
        PerformanceEntryType::MARK);
  }
}

void NativePerformance::clearMeasures(
    jsi::Runtime& /*rt*/,
    std::optional<std::string> entryName) {
  if (entryName) {
    PerformanceEntryReporter::getInstance()->clearEntries(
        PerformanceEntryType::MEASURE, *entryName);
  } else {
    PerformanceEntryReporter::getInstance()->clearEntries(
        PerformanceEntryType::MEASURE);
  }
}

std::vector<PerformanceEntry> NativePerformance::getEntries(
    jsi::Runtime& /*rt*/) {
  std::vector<PerformanceEntry> entries;

  for (auto entryType : ENTRY_TYPES_AVAILABLE_FROM_TIMELINE) {
    PerformanceEntryReporter::getInstance()->getEntries(entries, entryType);
  }

  sortEntries(entries);

  return entries;
}

std::vector<PerformanceEntry> NativePerformance::getEntriesByName(
    jsi::Runtime& /*rt*/,
    std::string entryName,
    std::optional<PerformanceEntryType> entryType) {
  std::vector<PerformanceEntry> entries;

  if (entryType) {
    if (isAvailableFromTimeline(*entryType)) {
      PerformanceEntryReporter::getInstance()->getEntries(
          entries, *entryType, entryName);
    }
  } else {
    for (auto type : ENTRY_TYPES_AVAILABLE_FROM_TIMELINE) {
      PerformanceEntryReporter::getInstance()->getEntries(
          entries, type, entryName);
    }
  }

  sortEntries(entries);

  return entries;
}

std::vector<PerformanceEntry> NativePerformance::getEntriesByType(
    jsi::Runtime& /*rt*/,
    PerformanceEntryType entryType) {
  std::vector<PerformanceEntry> entries;

  if (isAvailableFromTimeline(entryType)) {
    PerformanceEntryReporter::getInstance()->getEntries(entries, entryType);
  }

  sortEntries(entries);

  return entries;
}

std::vector<std::pair<std::string, uint32_t>> NativePerformance::getEventCounts(
    jsi::Runtime& /*rt*/) {
  const auto& eventCounts =
      PerformanceEntryReporter::getInstance()->getEventCounts();
  return {eventCounts.begin(), eventCounts.end()};
}

std::unordered_map<std::string, double> NativePerformance::getSimpleMemoryInfo(
    jsi::Runtime& rt) {
  auto heapInfo = rt.instrumentation().getHeapInfo(false);
  std::unordered_map<std::string, double> heapInfoToJs;
  for (auto& entry : heapInfo) {
    heapInfoToJs[entry.first] = static_cast<double>(entry.second);
  }
  return heapInfoToJs;
}

std::unordered_map<std::string, double>
NativePerformance::getReactNativeStartupTiming(jsi::Runtime& rt) {
  std::unordered_map<std::string, double> result;

  ReactMarker::StartupLogger& startupLogger =
      ReactMarker::StartupLogger::getInstance();
  if (!std::isnan(startupLogger.getAppStartupStartTime())) {
    result["startTime"] = startupLogger.getAppStartupStartTime();
  } else if (!std::isnan(startupLogger.getInitReactRuntimeStartTime())) {
    result["startTime"] = startupLogger.getInitReactRuntimeStartTime();
  }

  if (!std::isnan(startupLogger.getInitReactRuntimeStartTime())) {
    result["initializeRuntimeStart"] =
        startupLogger.getInitReactRuntimeStartTime();
  }

  if (!std::isnan(startupLogger.getRunJSBundleStartTime())) {
    result["executeJavaScriptBundleEntryPointStart"] =
        startupLogger.getRunJSBundleStartTime();
  }

  if (!std::isnan(startupLogger.getRunJSBundleEndTime())) {
    result["executeJavaScriptBundleEntryPointEnd"] =
        startupLogger.getRunJSBundleEndTime();
  }

  if (!std::isnan(startupLogger.getInitReactRuntimeEndTime())) {
    result["initializeRuntimeEnd"] = startupLogger.getInitReactRuntimeEndTime();
  }

  if (!std::isnan(startupLogger.getAppStartupEndTime())) {
    result["endTime"] = startupLogger.getAppStartupEndTime();
  }

  return result;
}

jsi::Object NativePerformance::createObserver(
    jsi::Runtime& rt,
    NativePerformancePerformanceObserverCallback callback) {
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

double NativePerformance::getDroppedEntriesCount(
    jsi::Runtime& rt,
    jsi::Object observerObj) {
  auto observer = tryGetObserver(rt, observerObj);

  if (!observer) {
    return 0;
  }

  return observer->getDroppedEntriesCount();
}

void NativePerformance::observe(
    jsi::Runtime& rt,
    jsi::Object observerObj,
    NativePerformancePerformanceObserverObserveOptions options) {
  auto observer = tryGetObserver(rt, observerObj);

  if (!observer) {
    return;
  }

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

void NativePerformance::disconnect(jsi::Runtime& rt, jsi::Object observerObj) {
  auto observerWrapper = std::dynamic_pointer_cast<PerformanceObserverWrapper>(
      observerObj.getNativeState(rt));

  if (!observerWrapper) {
    return;
  }

  auto observer = observerWrapper->observer;
  observer->disconnect();
}

std::vector<PerformanceEntry> NativePerformance::takeRecords(
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
    sortEntries(records);
  }
  return records;
}

std::vector<PerformanceEntryType>
NativePerformance::getSupportedPerformanceEntryTypes(jsi::Runtime& /*rt*/) {
  auto supportedEntryTypes = PerformanceEntryReporter::getSupportedEntryTypes();
  return {supportedEntryTypes.begin(), supportedEntryTypes.end()};
}

} // namespace facebook::react
