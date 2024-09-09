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
#include <reactperflogger/fusebox/FuseboxTracer.h>
#include "NativePerformance.h"
#include "Plugins.h"

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

void NativePerformance::mark(
    jsi::Runtime& rt,
    std::string name,
    double startTime) {
  PerformanceEntryReporter::getInstance()->mark(name, startTime);

#ifdef WITH_PERFETTO
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    auto [trackName, eventName] = parseTrackName(name);
    TRACE_EVENT_INSTANT(
        "react-native",
        perfetto::DynamicString(eventName.data(), eventName.size()),
        getPerfettoWebPerfTrackSync(trackName),
        performanceNowToPerfettoTraceTime(startTime));
  }
#endif
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

  FuseboxTracer::getFuseboxTracer().addEvent(
      eventName, (uint64_t)startTime, (uint64_t)endTime, trackName);
  PerformanceEntryReporter::getInstance()->measure(
      eventName, startTime, endTime, duration, startMark, endMark);

#ifdef WITH_PERFETTO
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    // TODO T190600850 support startMark/endMark
    if (!startMark && !endMark) {
      auto track = getPerfettoWebPerfTrackAsync(trackName);
      TRACE_EVENT_BEGIN(
          "react-native",
          perfetto::DynamicString(eventName.data(), eventName.size()),
          track,
          performanceNowToPerfettoTraceTime(startTime));
      TRACE_EVENT_END(
          "react-native", track, performanceNowToPerfettoTraceTime(endTime));
    }
  }
#endif
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

} // namespace facebook::react
