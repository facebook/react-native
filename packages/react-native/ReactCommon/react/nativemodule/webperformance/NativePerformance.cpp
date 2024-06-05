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

#include "Plugins.h"

#ifdef WITH_PERFETTO
#include <perfetto.h>
#include <reactperflogger/ReactPerfettoCategories.h>
#endif

std::shared_ptr<facebook::react::TurboModule> NativePerformanceModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativePerformance>(
      std::move(jsInvoker));
}

namespace facebook::react {

namespace {

#ifdef WITH_PERFETTO

// Offset for custom perfetto tracks
uint64_t trackId = 0x5F3759DF;

// Extract this once we start emitting perfetto markers from other modules
std::once_flag perfettoInit;
void initializePerfetto() {
  std::call_once(perfettoInit, []() {
    perfetto::TracingInitArgs args;
    args.backends |= perfetto::kSystemBackend;
    args.use_monotonic_clock = true;
    perfetto::Tracing::Initialize(args);
    perfetto::TrackEvent::Register();
  });
}

const std::string TRACK_PREFIX = "Track:";
const std::string DEFAULT_TRACK_NAME = "Web Performance";

std::tuple<perfetto::Track, std::string_view> parsePerfettoTrack(
    const std::string& name) {
  // Until there's a standard way to pass through track information, parse it
  // manually, e.g., "Track:Foo:Event name"
  // https://github.com/w3c/user-timing/issues/109
  std::optional<std::string> trackName;
  std::string_view eventName(name);
  if (name.starts_with(TRACK_PREFIX)) {
    const auto trackNameDelimiter = name.find(':', TRACK_PREFIX.length());
    if (trackNameDelimiter != std::string::npos) {
      trackName = name.substr(
          TRACK_PREFIX.length(), trackNameDelimiter - TRACK_PREFIX.length());
      eventName = std::string_view(name).substr(trackNameDelimiter + 1);
    }
  }

  auto& trackNameRef = trackName.has_value() ? *trackName : DEFAULT_TRACK_NAME;
  static std::unordered_map<std::string, perfetto::Track> tracks;
  auto it = tracks.find(trackNameRef);
  if (it == tracks.end()) {
    auto track = perfetto::Track(trackId++);
    auto desc = track.Serialize();
    desc.set_name(trackNameRef);
    perfetto::TrackEvent::SetTrackDescriptor(track, desc);
    tracks.emplace(trackNameRef, track);
    return std::make_tuple(track, eventName);
  } else {
    return std::make_tuple(it->second, eventName);
  }
}

// Perfetto's monotonic clock seems to match the std::chrono::steady_clock we
// use in JSExecutor::performanceNow on Android platforms, but if that
// assumption is incorrect we may need to manually offset perfetto timestamps.
uint64_t performanceNowToPerfettoTraceTime(double perfNowTime) {
  if (perfNowTime == 0) {
    return perfetto::TrackEvent::GetTraceTimeNs();
  }
  return static_cast<uint64_t>(perfNowTime * 1.e6);
}

#endif

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
#ifdef WITH_PERFETTO
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    auto [track, eventName] = parsePerfettoTrack(name);
    TRACE_EVENT_INSTANT(
        "react-native",
        perfetto::DynamicString(eventName.data(), eventName.size()),
        track,
        performanceNowToPerfettoTraceTime(startTime));
  }
#endif
  PerformanceEntryReporter::getInstance()->mark(name, startTime);
}

void NativePerformance::measure(
    jsi::Runtime& rt,
    std::string name,
    double startTime,
    double endTime,
    std::optional<double> duration,
    std::optional<std::string> startMark,
    std::optional<std::string> endMark) {
#ifdef WITH_PERFETTO
  if (TRACE_EVENT_CATEGORY_ENABLED("react-native")) {
    // TODO T190600850 support startMark/endMark
    if (!startMark && !endMark) {
      auto [track, eventName] = parsePerfettoTrack(name);
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
  PerformanceEntryReporter::getInstance()->measure(
      name, startTime, endTime, duration, startMark, endMark);
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
